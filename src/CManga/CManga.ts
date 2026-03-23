import {
    MangaUpdates,
    // TagSection,
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
} from '@paperback/types';

import { Parser } from './CMangaParser';

const DOMAIN = 'https://cmangax15.com/';
const DOMAIN_CANDIDATES = [
    'https://cmangax15.com/',
    'https://cmangax6.com/',
    'https://cmangafo.com/',
    'https://cmangad.com/',
    'https://cmangaac.com/',
    'https://cmanga.cc/',
];

export const CMangaInfo: SourceInfo = {
    version: '1.0.21',
    name: 'CManga',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois',
    description: 'Extension that pulls manga from CManga',
    contentRating: ContentRating.ADULT,
    websiteBaseURL: DOMAIN,
    sourceTags: [
        {
            text: 'Recommended',
            type: BadgeColor.BLUE
        }
    ],
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS
};

export class CManga implements ChapterProviding, MangaProviding, SearchResultsProviding, HomePageSectionsProviding {

    // constructor(private cheerio: CheerioAPI) { }

    stateManager = App.createSourceStateManager();
    private activeDomain: string = DOMAIN;

    readonly requestManager = App.createRequestManager({
        requestsPerSecond: 4,
        requestTimeout: 50000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {
                let referer = this.activeDomain;
                let origin = this.activeDomain.replace(/\/$/, '');

                try {
                    const parsed = new URL(request.url);
                    referer = `${parsed.protocol}//${parsed.host}/`;
                    origin = `${parsed.protocol}//${parsed.host}`;
                } catch {
                    // Keep active domain fallback when request URL is malformed.
                }

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': referer,
                        'origin': origin,
                        'user-agent': await this.requestManager.getDefaultUserAgent()
                    }
                };
                return request;
            },
            interceptResponse: async (response: Response): Promise<Response> => {
                return response;
            }
        }
    });

    private normalizeDomain(value: string): string {
        const trimmed = value.trim();
        if (!trimmed) return DOMAIN;
        return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
    }

    private async probeDomain(domain: string): Promise<boolean> {
        try {
            const request = App.createRequest({
                url: `${domain}api/home_album_list?num_chapter=0&sort=update&tag=&limit=1&page=1&user=0&child_protect=off`,
                method: 'GET',
            });
            const response = await this.requestManager.schedule(request, 1);
            if (response.status < 200 || response.status >= 300) return false;

            const parsed = JSON.parse(response.data as string);
            return !!parsed;
        } catch {
            return false;
        }
    }

    private async resolveDomain(forceRefresh = false): Promise<string> {
        if (!forceRefresh && this.activeDomain) return this.activeDomain;

        const saved = this.normalizeDomain(String((await this.stateManager.retrieve('cmanga_active_domain')) ?? DOMAIN));
        const queue = [saved, DOMAIN, ...DOMAIN_CANDIDATES.map((x) => this.normalizeDomain(x))]
            .filter((value, index, arr) => value && arr.indexOf(value) === index);

        for (const candidate of queue) {
            if (await this.probeDomain(candidate)) {
                this.activeDomain = candidate;
                await this.stateManager.store('cmanga_active_domain', candidate);
                return candidate;
            }
        }

        throw new Error('CManga domain auto-discovery failed.');
    }

    private async getDomain(): Promise<string> {
        return this.resolveDomain(false);
    }

    private buildUrl(domain: string, pathOrUrl: string): string {
        if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
        return `${domain}${pathOrUrl.replace(/^\/+/, '')}`;
    }

    private extractList(payload: any): any[] {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data?.data)) return payload.data.data;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.items)) return payload.items;
        return [];
    }

    private extractTotal(payload: any, fallbackCount: number): number {
        const raw = payload?.total ?? payload?.data?.total ?? payload?.meta?.total ?? fallbackCount;
        const value = Number(raw);
        return Number.isFinite(value) && value > 0 ? value : fallbackCount;
    }

    getMangaShareUrl(mangaId: string): string {
        return `${this.activeDomain}${mangaId}`;
    }

    parser = new Parser();

    // private async DOMTHML(url: string): Promise<CheerioStatic> {
    //     const request = App.createRequest({
    //         url: url,
    //         method: 'GET',
    //     });
    //     const response = await this.requestManager.schedule(request, 1);
    //     return this.cheerio.load(response.data as string);
    // }

    private async getAPI(pathOrUrl: string, retried = false): Promise<string> {
        const domain = await this.getDomain();
        const url = this.buildUrl(domain, pathOrUrl);

        const request = App.createRequest({
            url: url,
            method: 'GET',
        });
        let response = await this.requestManager.schedule(request, 1);

        if (!retried && (response.status >= 500 || response.status === 404)) {
            const refreshed = await this.resolveDomain(true);
            const retryRequest = App.createRequest({
                url: this.buildUrl(refreshed, pathOrUrl),
                method: 'GET',
            });
            response = await this.requestManager.schedule(retryRequest, 1);
        }

        return response.data as string;
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const domain = await this.getDomain();
        const payload = JSON.parse(await this.getAPI(`api/get_data_by_id?table=album&data=info&id=${mangaId}`));
        const infoRaw = payload?.data?.info ?? payload?.info;
        const info = typeof infoRaw === 'string' ? JSON.parse(infoRaw) : infoRaw;

        if (!info || typeof info !== 'object') {
            throw new Error('CManga details payload is invalid');
        }

        return this.parser.parseMangaDetails(info, mangaId, domain);
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const json = JSON.parse(await this.getAPI(`api/chapter_list?album=${mangaId}&page=1&limit=99999999&v=0`));
        return this.parser.parseChapters(json);
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const payload = JSON.parse(await this.getAPI(`api/chapter_image?chapter=${chapterId}&v=0`));
        const pagePayload = payload?.data ?? payload;
        const pages = this.parser.parseChapterDetails(pagePayload);
        return App.createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1;
        const domain = await this.getDomain();
        // const tags = query.includedTags?.map(tag => tag.id) ?? [];

        // const search = {
        //     status: "all",
        //     num_chapter: "0",
        //     sort: "new",
        //     tag: "",
        //     top: ""
        // };

        // tags.map((value) => {
        //     switch (value.split('.')[0]) {
        //         case 'sort':
        //             search.sort = String(value.split('.')[1]);
        //             break;
        //         case 'status':
        //             search.status = String(value.split('.')[1]);
        //             break;
        //         case 'num_chapter':
        //             search.num_chapter = String(value.split('.')[1]);
        //             break;
        //         case 'tag':
        //             search.tag = String(value.split('.')[1]);
        //             break;
        //         case 'top':
        //             search.top = String(value.split('.')[1]);
        //             break;
        //     }
        // });

        const url = /*query.title ?*/ encodeURI(`${domain}api/search?string=${query.title}`);
        // : (search.top !== '' ? `${DOMAIN}api/top?data=book_top`
        // : encodeURI(`${DOMAIN}api/list_item?page=${page}&limit=40&sort=${search.sort}&type=all&tag=${search.tag}&child=off&status=${search.status}&num_chapter=${search.num_chapter}`))

        // const request = App.createRequest({
        //     url: url,
        //     method: 'GET',
        // })
        // const response = await this.requestManager.schedule(request, 1);
        // const json = (query.title || search.top !== "") ? JSON.parse(response.data as string) : JSON.parse(JSON.parse(response.data as string));
        // const tiles = this.parser.parseSearch(json, search, DOMAIN);
        const payload = JSON.parse(await this.getAPI(url));
        const list = this.extractList(payload);
        const tiles = this.parser.parseSearch(list, domain);
        const allPage = Math.max(1, Math.ceil(this.extractTotal(payload, list.length) / 40));
        metadata = (page < allPage) ? { page: page + 1 } : undefined;
        return App.createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        console.log('CManga Running...');
        const domain = await this.getDomain();
        const sections: HomeSection[] = [
            App.createHomeSection({ id: 'new_updated', title: 'TRUYỆN MỚI CẬP NHẬT', containsMoreItems: true, type: HomeSectionType.singleRowNormal, }),
            // App.createHomeSection({ id: 'new_added', title: "VIP TRUYỆN SIÊU HAY", containsMoreItems: true, type: HomeSectionType.singleRowNormal, })
        ];

        for (const section of sections) {
            sectionCallback(section);
            let url: string;
            switch (section.id) {
                case 'new_updated':
                    url = `${domain}api/home_album_list?num_chapter=0&sort=update&tag=&limit=20&page=1&user=0&child_protect=off`;
                    break;
                // case 'new_added':
                //     url = `${DOMAIN}api/list_item?page=1&limit=20&sort=new&type=all&tag=Truy%E1%BB%87n%20si%C3%AAu%20hay&child=off&status=all&num_chapter=0`;
                //     break;
                default:
                    throw new Error('Invalid home section ID');
            }

            const payload = JSON.parse(await this.getAPI(url));
            const list = this.extractList(payload);
            switch (section.id) {
                case 'new_updated':
                    section.items = this.parser.parseNewUpdatedSection(list, domain);
                    break;
                // case 'new_added':
                //     section.items = this.parser.parseNewAddedSection(json, DOMAIN);
                //     break;
            }
            sectionCallback(section);
        }
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1;
        const domain = await this.getDomain();
        let url = '';
        switch (homepageSectionId) {
            case 'new_updated':
                url = `${domain}api/home_album_list?num_chapter=0&sort=update&tag=&limit=36&page=${page}&user=0&child_protect=off`;
                break;
            // case 'new_added':
            //     url = `${DOMAIN}api/list_item?page=${page}&limit=40&sort=new&type=all&tag=Truy%E1%BB%87n%20si%C3%AAu%20hay&child=off&status=all&num_chapter=0`
            //     break;
            default:
                throw new Error('Requested to getViewMoreItems for a section ID which doesn\'t exist');
        }

        const payload = JSON.parse(await this.getAPI(url));
        const list = this.extractList(payload);
        const manga = this.parser.parseViewMore(list, domain);
        const allPage = Math.max(1, Math.ceil(this.extractTotal(payload, list.length) / 40));
        metadata = (page < allPage) ? { page: page + 1 } : undefined;
        return App.createPagedResults({
            results: manga,
            metadata
        });
    }

    // async getSearchTags(): Promise<TagSection[]> {
    //     const url = DOMAIN
    //     const $ = await this.DOMTHML(url);
    //     return this.parser.parseTags($);
    // }

    async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {

        const domain = await this.getDomain();
        const updatedManga: any = [];
        const pages = 10;
        for (let page = 1; page <= pages; page++) {
            const url = `${domain}api/list_item?page=${page}&limit=40&sort=new&type=all&tag=&child_protect=off&status=all&num_chapter=0`
            const payload = JSON.parse(await this.getAPI(url));
            const list = this.extractList(payload);
            const updateManga = list.map((item: any) => {
                const id = `${item?.url ?? ''}-${item?.id_book ?? ''}`;
                const [datePart = '', timePart = ''] = String(item?.last_update ?? '').split(' ');
                const [year, month, day] = datePart.split('-');
                const [hour, minute] = timePart.split(':');
                const formattedTime = `${hour}:${minute}`;
                const formattedDate = `${month}/${day}/${year}`;
                const timeFinal = datePart && timePart ? new Date(`${formattedDate} ${formattedTime}`) : new Date(0);

                return {
                    id,
                    time: timeFinal
                };
            }).filter((item: any) => !!item.id && item.id !== '-');

            updatedManga.push(...updateManga);

        }

        const returnObject = this.parser.parseUpdatedManga(updatedManga, time, ids);
        mangaUpdatesFoundCallback(App.createMangaUpdates(returnObject));
    }
}