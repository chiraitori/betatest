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
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS | SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
};

export class YuriGarden implements ChapterProviding, MangaProviding, SearchResultsProviding, HomePageSectionsProviding {

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
        return `${DOMAIN}comic/${mangaId}`;
    }

    private async getJSON<T>(url: string): Promise<T> {
        const request = App.createRequest({
            url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        return data as T;
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
        const comic = await this.getJSON<any>(`${API_DOMAIN}api/comics/${mangaId}`);

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
        const chapters = await this.getJSON<any[]>(`${API_DOMAIN}api/chapters/comic/${mangaId}`);

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
        const request = App.createRequest({
            url: `${API_DOMAIN}api/chapters/pages/${chapterId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);

        if (response.status === 403) {
            throw new Error('Chapter pages are currently protected. Please run Cloudflare bypass for YuriGarden and retry.');
        }

        const pagesData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const pages = (pagesData as any[])
            .map((page) => normalizeImageUrl(page?.url))
            .filter(Boolean);

        if (!pages.length) {
            throw new Error('No pages found for this chapter');
        }

        return App.createChapterDetails({
            id: chapterId,
            mangaId,
            pages,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1;
        const limit = 12;
        const title = (query.title ?? '').trim();

        const url = `${API_DOMAIN}api/comics?page=${page}&limit=${limit}&full=true${title ? `&search=${encodeURIComponent(title)}` : ''}`;
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
        const sections: HomeSection[] = [
            App.createHomeSection({ id: 'random', title: 'Ngau nhien', containsMoreItems: false, type: HomeSectionType.singleRowNormal }),
            App.createHomeSection({ id: 'latest', title: 'Moi cap nhat', containsMoreItems: true, type: HomeSectionType.singleRowNormal }),
            App.createHomeSection({ id: 'trending', title: 'Xu huong', containsMoreItems: false, type: HomeSectionType.singleRowNormal }),
        ];

        for (const section of sections) {
            sectionCallback(section);

            switch (section.id) {
                case 'random': {
                    const randomComics = await this.getJSON<any[]>(`${API_DOMAIN}api/comics/random`);
                    section.items = randomComics.map((comic) => this.toPartialManga(comic));
                    break;
                }
                case 'latest': {
                    const payload = await this.getJSON<any>(`${API_DOMAIN}api/comics?page=1&limit=12&full=true`);
                    section.items = (payload.comics ?? []).map((comic: any) => this.toPartialManga(comic));
                    break;
                }
                case 'trending': {
                    const trending = await this.getJSON<any[]>(`${API_DOMAIN}api/comics/rank/trending?viewType=view&trendingType=day&r18=false`);
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
        const payload = await this.getJSON<any>(`${API_DOMAIN}api/comics?page=${page}&limit=${limit}&full=true`);

        const results = (payload.comics ?? []).map((comic: any) => this.toPartialManga(comic));
        const nextMetadata = page < Number(payload.totalPages ?? 1) ? { page: page + 1 } : undefined;

        return App.createPagedResults({
            results,
            metadata: nextMetadata,
        });
    }
}
