//在此處設置你的 host domain ，例如是 auto-proxy.example.org 的話可以設置為 auto-proxy.example.org ， auto-proxy.example 以及 auto-proxy 。
const DomainReplaceKey = ["auto-proxy.example.org","auto-proxy.example","auto-proxy"];

//在此處設定允許的網域和屏蔽的網域。請注意：這兩個列表不能共存，若要取消設定，請將對應的變量設定為 undefined 。
const AllowList = undefined;
const BlockList = ["114514.jp","114514.cn"];

//設置屏蔽的國家或地區，示例中的國家和地區代碼"xx"和"xx"目前并不存在于地球這個行星上(必須是小寫，如果你的星球有的話請發issue告訴我一下)，不啓用請設置為false(Boolean值)。
const BlockRegion = ["xy","xx"];

//設置屏蔽的IP位址，不啓用請設置為false(Boolean值)。
const BlockIP = ["192.168.254.78","192.168.254.87"];

//是否在請求被block的時候展示 可用/阻止 域名，Boolean類型，允許true和false。
const ShowAvailableList = true;

//設定代理的網址使用的protocol。支持 "http" 和 "https" , 若設爲 false 則尊重原始請求。
const URLProtocol = false;

//選擇是否强制禁用緩存（需要瀏覽器支援），允許true和false （Boolean 值）。
const DisableCache = true;

//域名映射表。例如" 'github': 'github.com' " = github.example.org => github.com 。
const DomainMap = {
    "github": "github.com"
}

addEventListener("fetch", event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {

    // fetch the i18n data from GitHub, save to KV.
    let LangCode = (function () {
        if (
            request.headers.get("accept-language") !== null
        ) {
            return request.headers.get("accept-language");
        } else {
            return "en";
        }
    })()

    let i18nData = await (async function () {
        let LangData = await AutoProxySpace.get(LangCode);
        if (LangData === null) {
            let LangDataUpToDate = await fetch(
                GetI18NDataAPI +
                LangCode +
                ".json"
            )
                .then(res => res.json())
                .catch(async res => {
                    return await fetch(
                        GetI18NDataAPI +
                        "en.json"
                    ).then(res => res.json)
                });
            AutoProxySpace.put(LangCode, JSON.stringify(LangDataUpToDate));
            return LangDataUpToDate;
        } else {
            return JSON.parse(LangData);
        }
    })()

    let url = new URL(request.url);
    if (!!URLProtocol) {
        url.protocol = URLProtocol+":";
    }

    //定義要proxy的位址。
    let ProxyDomain = url.host;
    for (let i=0;i<DomainReplaceKey.length;i++) {
        ProxyDomain = ProxyDomain.split("."+DomainReplaceKey[i])[0];
    }

    //替換 "-x-" 為 "."。
    ProxyDomain = ProxyDomain.replace(/-x-/gi,".");

    //替換 "-p-" 為 ":"。
    ProxyDomain = ProxyDomain.replace(/-p-/gi,":");

    //ProxyDomain的值在DomainMap裏面時，替換ProxyDomain的值為DomainMap裏面存儲的值。
    if (!!DomainMap[ProxyDomain]) {
        ProxyDomain = DomainMap[ProxyDomain];
    }

    //如果用戶請求了主域名則返回提示。

    if (ProxyDomain === "" || ProxyDomain === url.host) {

        let ReturnUsage = (function () {
            if (url.host.slice(-12) === ".workers.dev") {
                return i18nData.WorkersDevNotSupport;
            } else {
                return i18nData.ReturnUsage+url.host+"\r\n\r\n";
            }
        })()

        return new Response("" +
            i18nData.Introduce +
            ReturnUsage +
            i18nData.Limit +
            i18nData.Deploy +
            i18nData.Copyright,
            { headers: UniHeader }
        );
    }

    //檢查用戶是不是在BlockRegion發起的請求。是則返回對應的403頁面。
    if (request.headers.get("cf-ipcountry") !== null && !!BlockRegion && BlockRegion.includes(request.headers.get("cf-ipcountry"))) {
        return new Response(
            i18nData.DomainBlocked +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );
    }

    //檢查用戶的IP是否在BlockIP内。是則返回對應的403頁面。
    if (request.headers.get("cf-connecting-ip") !== null && !!BlockIP && BlockIP.includes(request.headers.get("cf-connecting-ip"))) {
        return new Response(
            i18nData.IPBlocked +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );
    }

    //檢查用戶請求的ProxyDomain是否在BlockList内或AllowList外，是則返回403頁面。
    if (BlockList !== undefined && AllowList === undefined && BlockList.includes(ProxyDomain)) {

        let BlockListText = (function (){
            if (ShowAvailableList) {
                let ReturnValue = i18nData.BlockList;
                for (let b in BlockList) {
                    ReturnValue += " " + BlockList[b] + "\r\n";
                }
                return ReturnValue;
            } else {
                return "";
            }
        })()

        return new Response(
            i18nData.DomainBlocked +
            BlockListText +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );

    } else if (BlockList === undefined && AllowList !== undefined && !AllowList.includes(ProxyDomain)) {


        let AllowListText = (function (){
            if (ShowAvailableList) {
                let ReturnValue = i18nData.AllowList;
                for (let b in AllowList) {
                    ReturnValue += " " + AllowList[b] + "\r\n";
                }
                return ReturnValue;
            } else {
                return "";
            }
        })()

        return new Response(
            i18nData.DomainNotAllow +
            AllowListText +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );

    } else if ((BlockList !== undefined) && (AllowList !== undefined)){
        //（靠北哦怎麽會有人這樣子搞的）
        return new Response(i18nData.ConfError,{
            headers: UniHeader
        });
    }



    //上面的全都沒有問題的話就開始請求要訪問的位址了。
    let NewRequestHeaders = new Headers(request.headers);

    NewRequestHeaders.set("Host", ProxyDomain);
    NewRequestHeaders.set("Referer", ProxyDomain);

    let OriginalResponse = await fetch(url.protocol+"//"+ProxyDomain+url.pathname+url.search, {
        method: request.method,
        headers: NewRequestHeaders
    })

    if (NewRequestHeaders.get("Upgrade") && NewRequestHeaders.get("Upgrade").toLowerCase() === "websocket") {
        return OriginalResponse;
    }


    let NewResponseHeaders = new Headers(OriginalResponse.headers);
    const status = OriginalResponse.status;

    //如果用戶配置了强制禁用緩存則設置Cache-Control標頭為no-store。
    if (DisableCache) {
        NewResponseHeaders.set("cache-control", "no-store");
    }

    NewResponseHeaders.set("access-control-allow-origin", "*");
    NewResponseHeaders.set("access-control-allow-credentials", "true");
    NewResponseHeaders.delete("content-security-policy");
    NewResponseHeaders.delete("content-security-policy-report-only");
    NewResponseHeaders.delete("clear-site-data");

    const ContentType = NewResponseHeaders.get("content-type");

    let ReplacedText;
    if (ContentType !== null && ContentType !== undefined) {
        if (
            (
                ContentType.includes("text/html") ||
                ContentType.includes("text/javascript") ||
                ContentType.includes("text/css")
            ) && ContentType.includes("UTF-8")
        ) {
            ReplacedText = await OriginalResponse.text()
            let ReplacerOriginalDomain = new RegExp(url.host,"gi");
            ReplacedText = ReplacedText.replace(ReplacerOriginalDomain, ProxyDomain);
        } else {
            ReplacedText = OriginalResponse.body
        }
    } else {
        ReplacedText = OriginalResponse.body
    }

    return new Response(ReplacedText, {
        status,
        headers: NewResponseHeaders
    });
}

AutoProxySpace = AutoProxySpace || {};

//定義要從何處獲取i18n資料.
let GetI18NDataAPI = "https://github.com/kobe-koto/Auto-Proxy/raw/auto-proxy-with-KV/i18n/";

//定義UniHeader。。。你一般不需要操心這個東西。
const UniHeader = {
    "Content-Type": "application/json;charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
};
