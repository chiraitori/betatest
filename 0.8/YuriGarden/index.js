(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeColor = void 0;
var BadgeColor;
(function (BadgeColor) {
    BadgeColor["BLUE"] = "default";
    BadgeColor["GREEN"] = "success";
    BadgeColor["GREY"] = "info";
    BadgeColor["YELLOW"] = "warning";
    BadgeColor["RED"] = "danger";
})(BadgeColor = exports.BadgeColor || (exports.BadgeColor = {}));

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],5:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
/**
* @deprecated Use {@link PaperbackExtensionBase}
*/
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    async getTags() {
        // @ts-ignore
        return this.getSearchTags?.();
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    let time;
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = exports.SourceIntents = void 0;
var SourceIntents;
(function (SourceIntents) {
    SourceIntents[SourceIntents["MANGA_CHAPTERS"] = 1] = "MANGA_CHAPTERS";
    SourceIntents[SourceIntents["MANGA_TRACKING"] = 2] = "MANGA_TRACKING";
    SourceIntents[SourceIntents["HOMEPAGE_SECTIONS"] = 4] = "HOMEPAGE_SECTIONS";
    SourceIntents[SourceIntents["COLLECTION_MANAGEMENT"] = 8] = "COLLECTION_MANAGEMENT";
    SourceIntents[SourceIntents["CLOUDFLARE_BYPASS_REQUIRED"] = 16] = "CLOUDFLARE_BYPASS_REQUIRED";
    SourceIntents[SourceIntents["SETTINGS_UI"] = 32] = "SETTINGS_UI";
})(SourceIntents = exports.SourceIntents || (exports.SourceIntents = {}));
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],7:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./ByteArray"), exports);
__exportStar(require("./Badge"), exports);
__exportStar(require("./interfaces"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./HomeSectionType"), exports);
__exportStar(require("./PaperbackExtensionBase"), exports);

},{"./Badge":1,"./ByteArray":2,"./HomeSectionType":3,"./PaperbackExtensionBase":4,"./Source":5,"./SourceInfo":6,"./interfaces":15}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],15:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./ChapterProviding"), exports);
__exportStar(require("./CloudflareBypassRequestProviding"), exports);
__exportStar(require("./HomePageSectionsProviding"), exports);
__exportStar(require("./MangaProgressProviding"), exports);
__exportStar(require("./MangaProviding"), exports);
__exportStar(require("./RequestManagerProviding"), exports);
__exportStar(require("./SearchResultsProviding"), exports);

},{"./ChapterProviding":8,"./CloudflareBypassRequestProviding":9,"./HomePageSectionsProviding":10,"./MangaProgressProviding":11,"./MangaProviding":12,"./RequestManagerProviding":13,"./SearchResultsProviding":14}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],60:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./DynamicUI/Exports/DUIBinding"), exports);
__exportStar(require("./DynamicUI/Exports/DUIForm"), exports);
__exportStar(require("./DynamicUI/Exports/DUIFormRow"), exports);
__exportStar(require("./DynamicUI/Exports/DUISection"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIButton"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIHeader"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIInputField"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUILabel"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUILink"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIMultilineLabel"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUINavigationButton"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIOAuthButton"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUISecureInputField"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUISelect"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIStepper"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUISwitch"), exports);
__exportStar(require("./Exports/ChapterDetails"), exports);
__exportStar(require("./Exports/Chapter"), exports);
__exportStar(require("./Exports/Cookie"), exports);
__exportStar(require("./Exports/HomeSection"), exports);
__exportStar(require("./Exports/IconText"), exports);
__exportStar(require("./Exports/MangaInfo"), exports);
__exportStar(require("./Exports/MangaProgress"), exports);
__exportStar(require("./Exports/PartialSourceManga"), exports);
__exportStar(require("./Exports/MangaUpdates"), exports);
__exportStar(require("./Exports/PBCanvas"), exports);
__exportStar(require("./Exports/PBImage"), exports);
__exportStar(require("./Exports/PagedResults"), exports);
__exportStar(require("./Exports/RawData"), exports);
__exportStar(require("./Exports/Request"), exports);
__exportStar(require("./Exports/SourceInterceptor"), exports);
__exportStar(require("./Exports/RequestManager"), exports);
__exportStar(require("./Exports/Response"), exports);
__exportStar(require("./Exports/SearchField"), exports);
__exportStar(require("./Exports/SearchRequest"), exports);
__exportStar(require("./Exports/SourceCookieStore"), exports);
__exportStar(require("./Exports/SourceManga"), exports);
__exportStar(require("./Exports/SecureStateManager"), exports);
__exportStar(require("./Exports/SourceStateManager"), exports);
__exportStar(require("./Exports/Tag"), exports);
__exportStar(require("./Exports/TagSection"), exports);
__exportStar(require("./Exports/TrackedMangaChapterReadAction"), exports);
__exportStar(require("./Exports/TrackerActionQueue"), exports);

},{"./DynamicUI/Exports/DUIBinding":17,"./DynamicUI/Exports/DUIForm":18,"./DynamicUI/Exports/DUIFormRow":19,"./DynamicUI/Exports/DUISection":20,"./DynamicUI/Rows/Exports/DUIButton":21,"./DynamicUI/Rows/Exports/DUIHeader":22,"./DynamicUI/Rows/Exports/DUIInputField":23,"./DynamicUI/Rows/Exports/DUILabel":24,"./DynamicUI/Rows/Exports/DUILink":25,"./DynamicUI/Rows/Exports/DUIMultilineLabel":26,"./DynamicUI/Rows/Exports/DUINavigationButton":27,"./DynamicUI/Rows/Exports/DUIOAuthButton":28,"./DynamicUI/Rows/Exports/DUISecureInputField":29,"./DynamicUI/Rows/Exports/DUISelect":30,"./DynamicUI/Rows/Exports/DUIStepper":31,"./DynamicUI/Rows/Exports/DUISwitch":32,"./Exports/Chapter":33,"./Exports/ChapterDetails":34,"./Exports/Cookie":35,"./Exports/HomeSection":36,"./Exports/IconText":37,"./Exports/MangaInfo":38,"./Exports/MangaProgress":39,"./Exports/MangaUpdates":40,"./Exports/PBCanvas":41,"./Exports/PBImage":42,"./Exports/PagedResults":43,"./Exports/PartialSourceManga":44,"./Exports/RawData":45,"./Exports/Request":46,"./Exports/RequestManager":47,"./Exports/Response":48,"./Exports/SearchField":49,"./Exports/SearchRequest":50,"./Exports/SecureStateManager":51,"./Exports/SourceCookieStore":52,"./Exports/SourceInterceptor":53,"./Exports/SourceManga":54,"./Exports/SourceStateManager":55,"./Exports/Tag":56,"./Exports/TagSection":57,"./Exports/TrackedMangaChapterReadAction":58,"./Exports/TrackerActionQueue":59}],61:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./generated/_exports"), exports);
__exportStar(require("./base/index"), exports);
__exportStar(require("./compat/DyamicUI"), exports);

},{"./base/index":7,"./compat/DyamicUI":16,"./generated/_exports":60}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YuriGarden = exports.YuriGardenInfo = void 0;
const types_1 = require("@paperback/types");
const DOMAIN = 'https://yurigarden.com/';
const API_DOMAIN = 'https://api.yurigarden.com/';
const STORE_DOMAIN = 'https://db.yurigarden.com/storage/v1/object/public/yuri-garden-store/';
const normalizeImageUrl = (path) => {
    if (!path)
        return 'https://i.imgur.com/GYUxEX8.png';
    if (path.startsWith('http://') || path.startsWith('https://'))
        return path;
    return `${STORE_DOMAIN}${path.replace(/^\/+/, '')}`;
};
const mapStatus = (status) => {
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
const pickFirstNumeric = (value) => {
    const match = value.match(/\d+/);
    return match?.[0];
};
const extractMangaId = (input) => {
    if (typeof input === 'number' && Number.isFinite(input))
        return String(input);
    const raw = String(input ?? '').trim();
    if (!raw)
        throw new Error('Missing manga ID');
    if (/^\d+$/.test(raw))
        return raw;
    // Supports full URL/share URL forms like https://yurigarden.com/comic/1234
    const comicRoute = raw.match(/\/comic\/(\d+)/i)?.[1];
    if (comicRoute)
        return comicRoute;
    const numeric = pickFirstNumeric(raw);
    if (numeric)
        return numeric;
    throw new Error(`Unable to extract manga ID from value: ${raw}`);
};
const extractChapterId = (input) => {
    if (typeof input === 'number' && Number.isFinite(input))
        return String(input);
    const raw = String(input ?? '').trim();
    if (!raw)
        throw new Error('Missing chapter ID');
    if (/^\d+$/.test(raw))
        return raw;
    // Supports URL forms like /comic/1234/5678 or chapter query strings.
    const chapterRoute = raw.match(/\/comic\/\d+\/(\d+)/i)?.[1];
    if (chapterRoute)
        return chapterRoute;
    const numeric = pickFirstNumeric(raw);
    if (numeric)
        return numeric;
    throw new Error(`Unable to extract chapter ID from value: ${raw}`);
};
exports.YuriGardenInfo = {
    version: '1.0.0',
    name: 'YuriGarden',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois',
    description: 'Extension that pulls manga from YuriGarden.',
    websiteBaseURL: DOMAIN,
    contentRating: types_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: 'Recommended',
            type: types_1.BadgeColor.BLUE,
        },
    ],
    intents: types_1.SourceIntents.MANGA_CHAPTERS | types_1.SourceIntents.HOMEPAGE_SECTIONS | types_1.SourceIntents.CLOUDFLARE_BYPASS_REQUIRED | types_1.SourceIntents.SETTINGS_UI,
};
class YuriGarden {
    constructor() {
        this.stateManager = App.createSourceStateManager();
        this.requestManager = App.createRequestManager({
            requestsPerSecond: 4,
            requestTimeout: 35000,
            interceptor: {
                interceptRequest: async (request) => {
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
                interceptResponse: async (response) => {
                    return response;
                },
            },
        });
    }
    async isR18Enabled() {
        const value = await this.stateManager.retrieve('enable_r18');
        return value === true;
    }
    async getR18QueryValue() {
        return (await this.isR18Enabled()) ? 'true' : 'false';
    }
    cloudflareError(status) {
        if (status == 503 || status == 403) {
            throw new Error(`CLOUDFLARE BYPASS ERROR:\nPlease go to home page ${exports.YuriGardenInfo.name} source and press the cloud icon.`);
        }
    }
    getMangaShareUrl(mangaId) {
        return `${DOMAIN}comic/${extractMangaId(mangaId)}`;
    }
    async getSourceMenu() {
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
                        set: async (value) => {
                            await this.stateManager.store('enable_r18', value[0] === 'on');
                        },
                    }),
                    labelResolver: async (option) => option === 'on' ? 'Show 18+ titles' : 'Hide 18+ titles',
                }),
            ],
            isHidden: false,
        });
    }
    async getJSON(url) {
        const request = App.createRequest({
            url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        this.cloudflareError(response.status);
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        return data;
    }
    async getCloudflareBypassRequestAsync() {
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
    toPartialManga(comic) {
        return App.createPartialSourceManga({
            mangaId: String(comic.id),
            image: normalizeImageUrl(comic.thumbnail),
            title: String(comic.title ?? 'Unknown title'),
            subtitle: comic.latestChapter?.name ? `Chapter ${comic.latestChapter.order}${comic.latestChapter.name ? ` - ${comic.latestChapter.name}` : ''}` : undefined,
        });
    }
    async getSearchTags() {
        const systems = await this.getJSON(`${API_DOMAIN}resources/systems_vi.json`);
        const genreSource = systems?.genres ?? {};
        const tags = Object.entries(genreSource).map(([key, value]) => {
            const label = typeof value === 'string'
                ? value
                : String(value?.name ?? value?.label ?? key);
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
    async getMangaDetails(mangaId) {
        const id = extractMangaId(mangaId);
        const comic = await this.getJSON(`${API_DOMAIN}api/comics/${id}`);
        const tags = (comic.genres ?? []).map((genre) => App.createTag({
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
                author: Array.isArray(comic.authors) ? comic.authors.map((x) => x?.name).filter(Boolean).join(', ') : '',
                artist: Array.isArray(comic.artists) ? comic.artists.map((x) => x?.name).filter(Boolean).join(', ') : '',
                desc,
                status: mapStatus(comic.status),
                tags: [App.createTagSection({ id: 'genres', label: 'Genres', tags })],
            }),
        });
    }
    async getChapters(mangaId) {
        const id = extractMangaId(mangaId);
        const chapters = await this.getJSON(`${API_DOMAIN}api/chapters/comic/${id}`);
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
    async getChapterDetails(mangaId, chapterId) {
        const normalizedMangaId = extractMangaId(mangaId);
        const normalizedChapterId = extractChapterId(chapterId);
        const request = App.createRequest({
            url: `${API_DOMAIN}api/chapters/pages/${normalizedChapterId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        this.cloudflareError(response.status);
        const pagesData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const pageItems = Array.isArray(pagesData)
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
            if (typeof page === 'string')
                return normalizeImageUrl(page);
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
    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const limit = 12;
        const title = (query.title ?? '').trim();
        const r18 = await this.getR18QueryValue();
        const url = `${API_DOMAIN}api/comics?page=${page}&limit=${limit}&full=true&r18=${r18}${title ? `&search=${encodeURIComponent(title)}` : ''}`;
        const payload = await this.getJSON(url);
        const allResults = (payload.comics ?? []).map((comic) => this.toPartialManga(comic));
        const selectedGenres = new Set((query.includedTags ?? []).map((tag) => tag.id));
        const results = selectedGenres.size
            ? allResults.filter((_, idx) => {
                const comic = payload.comics[idx];
                const genres = comic?.genres ?? [];
                for (const genre of genres) {
                    if (selectedGenres.has(genre))
                        return true;
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
    async getHomePageSections(sectionCallback) {
        const r18 = await this.getR18QueryValue();
        const sections = [
            App.createHomeSection({ id: 'random', title: 'Ngau nhien', containsMoreItems: false, type: types_1.HomeSectionType.singleRowNormal }),
            App.createHomeSection({ id: 'latest', title: 'Moi cap nhat', containsMoreItems: true, type: types_1.HomeSectionType.singleRowNormal }),
            App.createHomeSection({ id: 'trending', title: 'Xu huong', containsMoreItems: false, type: types_1.HomeSectionType.singleRowNormal }),
        ];
        for (const section of sections) {
            sectionCallback(section);
            switch (section.id) {
                case 'random': {
                    const randomComics = await this.getJSON(`${API_DOMAIN}api/comics/random?r18=${r18}`);
                    section.items = randomComics.map((comic) => this.toPartialManga(comic));
                    break;
                }
                case 'latest': {
                    const payload = await this.getJSON(`${API_DOMAIN}api/comics?page=1&limit=12&full=true&r18=${r18}`);
                    section.items = (payload.comics ?? []).map((comic) => this.toPartialManga(comic));
                    break;
                }
                case 'trending': {
                    const trending = await this.getJSON(`${API_DOMAIN}api/comics/rank/trending?viewType=view&trendingType=day&r18=${r18}`);
                    section.items = trending.map((comic) => this.toPartialManga(comic));
                    break;
                }
            }
            sectionCallback(section);
        }
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        if (homepageSectionId !== 'latest') {
            throw new Error('Requested to getViewMoreItems for a section ID which does not support pagination.');
        }
        const page = metadata?.page ?? 1;
        const limit = 12;
        const r18 = await this.getR18QueryValue();
        const payload = await this.getJSON(`${API_DOMAIN}api/comics?page=${page}&limit=${limit}&full=true&r18=${r18}`);
        const results = (payload.comics ?? []).map((comic) => this.toPartialManga(comic));
        const nextMetadata = page < Number(payload.totalPages ?? 1) ? { page: page + 1 } : undefined;
        return App.createPagedResults({
            results,
            metadata: nextMetadata,
        });
    }
}
exports.YuriGarden = YuriGarden;

},{"@paperback/types":61}]},{},[62])(62)
});
