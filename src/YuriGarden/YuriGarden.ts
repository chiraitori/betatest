import {
    Tag,
    TagSection,
    SourceManga,
    Chapter,
    ChapterDetails,
    HomeSection,
    HomeSectionType,
    SearchRequest,
    PagedResults,
    Request,
    Response,
    ChapterProviding,
    MangaProviding,
    SearchResultsProviding,
    HomePageSectionsProviding,
    SourceInfo,
    ContentRating,
    SourceIntents,
    BadgeColor,
    PartialSourceManga,
    DUISection,
} from '@paperback/types';

const DOMAIN = 'https://yurigarden.com/';
const API_DOMAIN = 'https://api.yurigarden.com/';
const STORE_DOMAIN = 'https://db.yurigarden.com/storage/v1/object/public/yuri-garden-store/';

const normalizeImageUrl = (path?: string): string => {
    if (!path) return 'https://i.imgur.com/GYUxEX8.png';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${STORE_DOMAIN}${path.replace(/^\/+/, '')}`;
};

const mapStatus = (status?: string): string => {
    switch ((status ?? '').toLowerCase()) {
        case 'ongoing':
            return 'ONGOING';
        case 'completed':
            return 'COMPLETED';
        case 'oncoming':
            return 'ON_HIATUS';
        case 'hiatus':
            return 'ON_HIATUS';
        default:
            return 'UNKNOWN';
    }
};

const pickFirstNumeric = (value: string): string | undefined => {
    const match = value.match(/\d+/);
    return match?.[0];
};

const extractMangaId = (input: unknown): string => {
    if (typeof input === 'number' && Number.isFinite(input)) return String(input);
    const raw = String(input ?? '').trim();
    if (!raw) throw new Error('Missing manga ID');

    if (/^\d+$/.test(raw)) return raw;

    // Supports full URL/share URL forms like https://yurigarden.com/comic/1234
    const comicRoute = raw.match(/\/comic\/(\d+)/i)?.[1];
    if (comicRoute) return comicRoute;

    const numeric = pickFirstNumeric(raw);
    if (numeric) return numeric;

    throw new Error(`Unable to extract manga ID from value: ${raw}`);
};

const extractChapterId = (input: unknown): string => {
    if (typeof input === 'number' && Number.isFinite(input)) return String(input);
    const raw = String(input ?? '').trim();
    if (!raw) throw new Error('Missing chapter ID');

    if (/^\d+$/.test(raw)) return raw;

    // Supports URL forms like /comic/1234/5678 or chapter query strings.
    const chapterRoute = raw.match(/\/comic\/\d+\/(\d+)/i)?.[1];
    if (chapterRoute) return chapterRoute;

    const numeric = pickFirstNumeric(raw);
    if (numeric) return numeric;

    throw new Error(`Unable to extract chapter ID from value: ${raw}`);
};

export const YuriGardenInfo: SourceInfo = {
    version: '1.0.0',
    name: 'YuriGarden',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois',
    description: 'Extension that pulls manga from YuriGarden.',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: 'Recommended',
            type: BadgeColor.BLUE,
        },
    ],
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS | SourceIntents.CLOUDFLARE_BYPASS_REQUIRED | SourceIntents.SETTINGS_UI,
};

export class YuriGarden implements ChapterProviding, MangaProviding, SearchResultsProviding, HomePageSectionsProviding {

    stateManager = App.createSourceStateManager();

    private async isR18Enabled(): Promise<boolean> {
        const value = await this.stateManager.retrieve('enable_r18');
        return value === true;
    }

    private async getR18QueryValue(): Promise<string> {
        return (await this.isR18Enabled()) ? 'true' : 'false';
    }

    private cloudflareError(status: number): void {
        if (status == 503 || status == 403) {
            throw new Error(`CLOUDFLARE BYPASS ERROR:\nPlease go to home page ${YuriGardenInfo.name} source and press the cloud icon.`);
        }
    }

    readonly requestManager = App.createRequestManager({
        requestsPerSecond: 4,
        requestTimeout: 35000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {
                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        referer: DOMAIN,
                        origin: DOMAIN.replace(/\/$/, ''),
                        'x-app-origin': DOMAIN.replace(/\/$/, ''),
                        'x-custom-lang': 'vi',
                        accept: 'application/json, text/plain, */*',
                        'user-agent': await this.requestManager.getDefaultUserAgent(),
                    },
                };
                return request;
            },
            interceptResponse: async (response: Response): Promise<Response> => {
                return response;
            },
        },
    });

    getMangaShareUrl(mangaId: string): string {
        return `${DOMAIN}comic/${extractMangaId(mangaId)}`;
    }

    async getSourceMenu(): Promise<DUISection> {
        return App.createDUISection({
            id: 'main',
            header: 'YuriGarden Settings',
            rows: async () => [
                App.createDUISelect({
                    id: 'adult_content',
                    label: '18+ Content',
                    options: ['off', 'on'],
                    allowsMultiselect: false,
                    value: App.createDUIBinding({
                        get: async () => [(await this.isR18Enabled()) ? 'on' : 'off'],
                        set: async (value: string[]) => {
                            await this.stateManager.store('enable_r18', value[0] === 'on');
                        },
                    }),
                    labelResolver: async (option: string) => option === 'on' ? 'Show 18+ titles' : 'Hide 18+ titles',
                }),
            ],
            isHidden: false,
        });
    }

    private async getJSON<T>(url: string): Promise<T> {
        const request = App.createRequest({
            url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        this.cloudflareError(response.status);
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        return data as T;
    }

    async getCloudflareBypassRequestAsync(): Promise<Request> {
        return App.createRequest({
            url: DOMAIN,
            method: 'GET',
            headers: {
                referer: DOMAIN,
                origin: DOMAIN.replace(/\/$/, ''),
                'user-agent': await this.requestManager.getDefaultUserAgent(),
            },
        });
    }

    private toPartialManga(comic: any): PartialSourceManga {
        return App.createPartialSourceManga({
            mangaId: String(comic.id),
            image: normalizeImageUrl(comic.thumbnail),
            title: String(comic.title ?? 'Unknown title'),
            subtitle: comic.latestChapter?.name ? `Chapter ${comic.latestChapter.order}${comic.latestChapter.name ? ` - ${comic.latestChapter.name}` : ''}` : undefined,
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const systems = await this.getJSON<any>(`${API_DOMAIN}resources/systems_vi.json`);
        const genreSource = systems?.genres ?? {};

        const tags: Tag[] = Object.entries(genreSource).map(([key, value]) => {
            const label = typeof value === 'string'
                ? value
                : String((value as any)?.name ?? (value as any)?.label ?? key);
            return App.createTag({ id: key, label });
        });

        return [
            App.createTagSection({
                id: 'genres',
                label: 'Genres',
                tags,
            }),
        ];
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const id = extractMangaId(mangaId);
        const comic = await this.getJSON<any>(`${API_DOMAIN}api/comics/${id}`);

        const tags: Tag[] = (comic.genres ?? []).map((genre: string) => App.createTag({
            id: genre,
            label: genre,
        }));

        const desc = [
            comic.description,
            Array.isArray(comic.anotherNames) && comic.anotherNames.length > 0
                ? `Alternative names: ${comic.anotherNames.join(', ')}`
                : undefined,
        ].filter(Boolean).join('\n\n');

        return App.createSourceManga({
            id: String(comic.id),
            mangaInfo: App.createMangaInfo({
                titles: [String(comic.title ?? '')],
                image: normalizeImageUrl(comic.thumbnail),
                author: Array.isArray(comic.authors) ? comic.authors.map((x: any) => x?.name).filter(Boolean).join(', ') : '',
                artist: Array.isArray(comic.artists) ? comic.artists.map((x: any) => x?.name).filter(Boolean).join(', ') : '',
                desc,
                status: mapStatus(comic.status),
                tags: [App.createTagSection({ id: 'genres', label: 'Genres', tags })],
            }),
        });
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const id = extractMangaId(mangaId);
        const chapters = await this.getJSON<any[]>(`${API_DOMAIN}api/chapters/comic/${id}`);

        return [...chapters]
            .sort((a, b) => Number(a.order) - Number(b.order))
            .map((chapter) => {
                const order = Number(chapter.order ?? 0);
                const suffix = String(chapter.name ?? '').trim();
                const name = suffix ? `Chapter ${order} - ${suffix}` : `Chapter ${order}`;

                return App.createChapter({
                    id: String(chapter.id),
                    chapNum: order,
                    name,
                    langCode: '🇻🇳',
                    time: new Date(Number(chapter.publishedAt ?? chapter.lastUpdated ?? Date.now())),
                });
            });
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const normalizedMangaId = extractMangaId(mangaId);
        const normalizedChapterId = extractChapterId(chapterId);
        const request = App.createRequest({
            url: `${API_DOMAIN}api/chapters/pages/${normalizedChapterId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        this.cloudflareError(response.status);

        const pagesData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

        const pageItems: any[] = Array.isArray(pagesData)
            ? pagesData
            : Array.isArray(pagesData?.pages)
                ? pagesData.pages
                : Array.isArray(pagesData?.data)
                    ? pagesData.data
                    : Array.isArray(pagesData?.result)
                        ? pagesData.result
                        : [];

        const pages = pageItems
            .map((page) => {
                if (typeof page === 'string') return normalizeImageUrl(page);
                return normalizeImageUrl(page?.url ?? page?.image ?? page?.src ?? page?.path);
            })
            .filter(Boolean);

        if (!Array.isArray(pagesData) && pageItems.length === 0) {
            const apiMessage = String(pagesData?.message ?? pagesData?.error ?? '').toLowerCase();
            if (response.status === 403 || pagesData?.statusCode === 403 || apiMessage.includes('forbidden')) {
                throw new Error('Chapter is protected. Open YuriGarden source and complete Cloudflare/verification, then try again.');
            }
        }

        if (!pages.length) {
            throw new Error('No pages found for this chapter');
        }

        return App.createChapterDetails({
            id: normalizedChapterId,
            mangaId: normalizedMangaId,
            pages,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1;
        const limit = 12;
        const title = (query.title ?? '').trim();
        const r18 = await this.getR18QueryValue();

        const url = `${API_DOMAIN}api/comics?page=${page}&limit=${limit}&full=true&r18=${r18}${title ? `&search=${encodeURIComponent(title)}` : ''}`;
        const payload = await this.getJSON<any>(url);

        const allResults: PartialSourceManga[] = (payload.comics ?? []).map((comic: any) => this.toPartialManga(comic));

        const selectedGenres = new Set((query.includedTags ?? []).map((tag) => tag.id));
        const results = selectedGenres.size
            ? allResults.filter((_, idx) => {
                const comic = payload.comics[idx];
                const genres: string[] = comic?.genres ?? [];
                for (const genre of genres) {
                    if (selectedGenres.has(genre)) return true;
                }
                return false;
            })
            : allResults;

        const nextMetadata = page < Number(payload.totalPages ?? 1) ? { page: page + 1 } : undefined;

        return App.createPagedResults({
            results,
            metadata: nextMetadata,
        });
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const r18 = await this.getR18QueryValue();
        const sections: HomeSection[] = [
            App.createHomeSection({ id: 'random', title: 'Ngau nhien', containsMoreItems: false, type: HomeSectionType.singleRowNormal }),
            App.createHomeSection({ id: 'latest', title: 'Moi cap nhat', containsMoreItems: true, type: HomeSectionType.singleRowNormal }),
            App.createHomeSection({ id: 'trending', title: 'Xu huong', containsMoreItems: false, type: HomeSectionType.singleRowNormal }),
        ];

        for (const section of sections) {
            sectionCallback(section);

            switch (section.id) {
                case 'random': {
                    const randomComics = await this.getJSON<any[]>(`${API_DOMAIN}api/comics/random?r18=${r18}`);
                    section.items = randomComics.map((comic) => this.toPartialManga(comic));
                    break;
                }
                case 'latest': {
                    const payload = await this.getJSON<any>(`${API_DOMAIN}api/comics?page=1&limit=12&full=true&r18=${r18}`);
                    section.items = (payload.comics ?? []).map((comic: any) => this.toPartialManga(comic));
                    break;
                }
                case 'trending': {
                    const trending = await this.getJSON<any[]>(`${API_DOMAIN}api/comics/rank/trending?viewType=view&trendingType=day&r18=${r18}`);
                    section.items = trending.map((comic) => this.toPartialManga(comic));
                    break;
                }
            }

            sectionCallback(section);
        }
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        if (homepageSectionId !== 'latest') {
            throw new Error('Requested to getViewMoreItems for a section ID which does not support pagination.');
        }

        const page = metadata?.page ?? 1;
        const limit = 12;
        const r18 = await this.getR18QueryValue();
        const payload = await this.getJSON<any>(`${API_DOMAIN}api/comics?page=${page}&limit=${limit}&full=true&r18=${r18}`);

        const results = (payload.comics ?? []).map((comic: any) => this.toPartialManga(comic));
        const nextMetadata = page < Number(payload.totalPages ?? 1) ? { page: page + 1 } : undefined;

        return App.createPagedResults({
            results,
            metadata: nextMetadata,
        });
    }
}
