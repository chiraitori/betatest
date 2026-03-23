import {
    Chapter,
    SourceManga,
    Tag,
    // TagSection,
    MangaUpdates,
    PartialSourceManga
} from '@paperback/types'

const entities = require("entities");

export class Parser {

    private toItems(json: any): any[] {
        if (Array.isArray(json)) return json;
        if (Array.isArray(json?.data?.data)) return json.data.data;
        if (Array.isArray(json?.data)) return json.data;
        if (Array.isArray(json?.items)) return json.items;
        if (json && typeof json === 'object') {
            return Object.values(json).filter((value: any) => value && typeof value === 'object' && !Array.isArray(value));
        }
        return [];
    }

    private parseInfo(item: any): any | undefined {
        if (!item || typeof item !== 'object') return undefined;
        const rawInfo = item.info ?? item['info'];

        if (typeof rawInfo === 'string') {
            try {
                return JSON.parse(rawInfo);
            } catch {
                return undefined;
            }
        }

        if (rawInfo && typeof rawInfo === 'object') return rawInfo;
        if (item.name || item.avatar || item.chapter) return item;
        return undefined;
    }

    private buildAlbumImage(domain: string, avatar?: string): string {
        const value = String(avatar ?? '').trim();
        if (!value) return '';
        if (/^https?:\/\//i.test(value)) return value;
        return `${domain}assets/tmp/album/${value}`;
    }

    parseMangaDetails(json: any, mangaId: string, DOMAIN: string): SourceManga {
        const tags: Tag[] = [];

        const sourceTags = Array.isArray(json?.tags) ? json.tags : [];
        for (const id of sourceTags) {
            if (!id) continue;
            const label = this.titleCase(id);
            tags.push(App.createTag({ label, id }));
        }
        const titles = [this.titleCase(String(json?.name ?? ''))];
        const status = json?.status == 'doing' ? 'Đang cập nhật' : 'Hoàn thành'
        const desc = this.decodeHTMLEntity(String(json?.detail ?? ''))
        const image = this.buildAlbumImage(DOMAIN, json?.avatar)

        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles,
                image,
                status,
                desc,
                tags: [App.createTagSection({ id: '0', label: 'genres', tags: tags })]
            })
        })
    }

    parseChapters(json: any): Chapter[] {
        const chapters: Chapter[] = [];

        for (const obj of this.toItems(json)) {
            const in4 = this.parseInfo(obj);
            if (!in4) continue;

            const lastUpdate = String(in4.last_update ?? '').trim();
            const [date, time] = lastUpdate.split(' ');
            const [year, month, day] = String(date ?? '').split('-');
            const [hour, minute] = String(time ?? '').split(':');
            const formattedTime = `${hour}:${minute}`
            const formattedDate = `${month}/${day}/${year}`

            const id = String(obj.id_chapter ?? obj.id ?? '');
            if (!id) continue;

            const chapNum = parseFloat(String(in4.num ?? in4.chapter?.last ?? 0));
            const name = this.titleCase(String(in4.name ?? `Chapter ${Number.isFinite(chapNum) ? chapNum : ''}`));

            chapters.push(App.createChapter({
                id,
                chapNum: Number.isFinite(chapNum) ? chapNum : 0,
                name,
                langCode: '🇻🇳',
                time: date && time ? new Date(`${formattedDate} ${formattedTime}`) : new Date(),
                group: `${in4?.statics?.view ?? 0} lượt xem`,
            }));
        }

        if (chapters.length == 0) {
            throw new Error('No chapters found');
        }

        return chapters;
    }

    parseChapterDetails(json: any): string[] {
        const pages: string[] = [];

        const imageList = Array.isArray(json?.image) ? json.image : [];
        for (const img of imageList) {
            if (typeof img !== 'string') continue;
            pages.push(img.replace('?v=1&', '?v=9999&'));
        }

        return pages
    }

    parseSearch(json: any, /*search: any,*/ DOMAIN: string): PartialSourceManga[] {
        const manga: PartialSourceManga[] = [];

        const getData = (item: any, in4: any) => ({
            mangaId: `${item.id_album}`,
            image: this.buildAlbumImage(DOMAIN, in4.avatar),
            title: this.titleCase(in4.name),
            subtitle: `Chap ${in4?.chapter?.last ?? '?'}`,
            // subtitle: search.top !== '' ? `${Number(item.total_view).toLocaleString()} views` : `Chap ${item.last_chapter}`
        });

        for (const item of this.toItems(json)) {
            const in4 = this.parseInfo(item)
            if (!item?.id_album || !in4?.name) continue;
            manga.push(App.createPartialSourceManga(getData(item, in4)));
        }

        return manga;
    }

    parseNewUpdatedSection(json: any, DOMAIN: string): PartialSourceManga[] {
        const newUpdatedItems: PartialSourceManga[] = [];

        for (const item of this.toItems(json)) {
            const in4 = this.parseInfo(item)
            if (!item?.id_album || !in4?.name) continue;

            newUpdatedItems.push(App.createPartialSourceManga({
                mangaId: `${item.id_album}`,
                image: this.buildAlbumImage(DOMAIN, in4.avatar),
                title: this.titleCase(in4.name),
                subtitle: `Chap ${in4?.chapter?.last ?? '?'}`,
            }))
        }

        return newUpdatedItems;
    }

    parseNewAddedSection(json: any, DOMAIN: string): PartialSourceManga[] {
        const newAddedItems: PartialSourceManga[] = [];

        for (var i of Object.keys(json)) {
            var item = json[i];
            if (!item.name) continue;
            newAddedItems.push(App.createPartialSourceManga({
                mangaId: `${item.url}-${item.id_book}`,
                image: `${DOMAIN}assets/tmp/book/avatar/${item.avatar}.jpg`,
                title: this.titleCase(item.name),
                subtitle: `Chap ${item.last_chapter}`,
            }))
        }

        return newAddedItems;
    }

    parseViewMore(json: any, DOMAIN: string): PartialSourceManga[] {
        const manga: PartialSourceManga[] = [];

        const getData = (item: any, in4: any) => ({
            mangaId: `${item.id_album}`,
            image: this.buildAlbumImage(DOMAIN, in4.avatar),
            title: this.titleCase(in4.name),
            subtitle: `Chap ${in4?.chapter?.last ?? '?'}`,
        });

        for (const item of this.toItems(json)) {
            const in4 = this.parseInfo(item)
            if (!item?.id_album || !in4?.name) continue;
            manga.push(App.createPartialSourceManga(getData(item, in4)));
        }

        return manga;
    }

    // parseTags($: CheerioStatic): TagSection[] {
    //     const arrayTags: Tag[] = [];

    //     for (const tag of $('.book_tags_content a').toArray()) {
    //         const label = $(tag).text().trim();
    //         const id = 'tag.' + label;
    //         arrayTags.push({ id: id, label: label });
    //     }

    //     const arrayTags2: Tag[] = [
    //         {
    //             label: 'Ngày đăng',
    //             id: 'sort.new'
    //         },
    //         {
    //             label: 'Lượt xem',
    //             id: 'sort.view'
    //         },
    //         {
    //             label: 'Lượt theo dõi',
    //             id: 'sort.follow'
    //         }
    //     ];

    //     const arrayTags3: Tag[] = [
    //         {
    //             label: 'Tất cả',
    //             id: 'status.all'
    //         },
    //         {
    //             label: 'Hoàn thành',
    //             id: 'status.completed'
    //         }
    //     ];

    //     const arrayTags4: Tag[] = [
    //         {
    //             label: '>= 100',
    //             id: 'num.100'
    //         },
    //         {
    //             label: '>= 200',
    //             id: 'num.200'
    //         },
    //         {
    //             label: '>= 300',
    //             id: 'num.300'
    //         },
    //         {
    //             label: '>= 400',
    //             id: 'num.400'
    //         },
    //         {
    //             label: '>= 500',
    //             id: 'num.500'
    //         }
    //     ];

    //     const arrayTags5: Tag[] = [
    //         {
    //             label: 'Top Ngày',
    //             id: 'top.day'
    //         },
    //         {
    //             label: 'Top Tuần',
    //             id: 'top.week'
    //         },
    //         {
    //             label: 'Top Tổng',
    //             id: 'top.month'
    //         }
    //     ];

    //     const tagSections: TagSection[] = [
    //         App.createTagSection({ id: '4', label: 'Rank', tags: arrayTags5.map(x => App.createTag(x)) }),
    //         App.createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => App.createTag(x)) }),
    //         App.createTagSection({ id: '1', label: 'Sắp xếp theo', tags: arrayTags2.map(x => App.createTag(x)) }),
    //         App.createTagSection({ id: '2', label: 'Tình trạng', tags: arrayTags3.map(x => App.createTag(x)) }),
    //         App.createTagSection({ id: '3', label: 'Num chapter', tags: arrayTags4.map(x => App.createTag(x)) })
    //     ]

    //     return tagSections;
    // }

    parseUpdatedManga(updatedManga: any, time: Date, ids: string[]): MangaUpdates {
        const returnObject: MangaUpdates = {
            ids: []
        };

        for (const elem of updatedManga) {
            if (ids.includes(elem.id) && time < elem.time) {
                returnObject.ids.push(elem.id);
            }
        }

        return returnObject;

    }

    private decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str);
    }

    private titleCase(str: string): string {
        var splitStr = str.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = String(splitStr[i]).charAt(0).toUpperCase() + String(splitStr[i]).substring(1);
        }

        return splitStr.join(' ');
    }

    // private change_alias(alias: any) {
    //     var str = alias;
    //     str = str.toLowerCase().trim();

    //     const charMap: { [key: string]: string } = {
    //         à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    //         ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
    //         â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
    //         đ: 'd',
    //         è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    //         ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
    //         ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    //         ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    //         ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
    //         ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
    //         ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    //         ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
    //         ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    //     };

    //     // Replace Vietnamese characters with their non-diacritic counterparts
    //     str = str.replace(/[\u0300-\u036f]/g, (match: string) => charMap[match] || '');

    //     // Replace spaces with hyphens
    //     str = str.replace(/\s+/g, '-');

    //     // Remove consecutive hyphens
    //     str = str.replace(/-{2,}/g, '-');

    //     return str;
    // }

    // decrypt_data(data: any) {
    //     const CryptoJS = require('crypto-js');
    //     const parsed = data;
    //     const type = parsed.ciphertext;
    //     const score = CryptoJS.enc.Hex.parse(parsed.iv);
    //     const lastviewmatrix = CryptoJS.enc.Hex.parse(parsed.salt);
    //     const adjustedLevel = CryptoJS.PBKDF2("nettruyenhayvn", lastviewmatrix, {
    //         hasher: CryptoJS.algo.SHA512,
    //         keySize: 64 / 8,
    //         iterations: 999,
    //     });
    //     const queryTokenScores = { iv: '' };
    //     queryTokenScores["iv"] = score;
    //     const pixelSizeTargetMax = CryptoJS.AES.decrypt(
    //         type,
    //         adjustedLevel,
    //         queryTokenScores
    //     );
    //     return pixelSizeTargetMax.toString(CryptoJS.enc.Utf8);
    // }
}