//your password.
const Password = "LOL"

//定義要從何處獲取i18n資料.
let GetI18NDataAPI = "https://github.com/kobe-koto/Auto-Proxy/raw/main/i18n/";

addEventListener("fetch", event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply (request) {

    let config = (
        JSON.parse(await AutoProxySpace.get("_config")) ||
        {
            "NotConfig": true,
            "HostDomain": [],
            "DomainMap": {},
            "BlockRegion": [],
            "BlockIP": [],
            "AllowList": [],
            "BlockList": []
        }
    );

    let i18nData = await GetI18NData (request);

    let url = new URL(request.url);
    if (!!config.URLProtocol) {
        url.protocol = (config.URLProtocol || "https") + ":";
    }

    //定義要proxy的位址。
    let ProxyDomain = (function () {
        let ProxyDomain = url.host;

        //用for從url.host裏面去掉不要的主域名
        for (let i=0;i<(config.HostDomain.length || 0 );i++) {
            ProxyDomain = ProxyDomain.split("."+config.HostDomain[i])[0];
        }

        //替換 "-x-" 為 "." , "-p-" 為 ":" .
        ProxyDomain =
            ProxyDomain
                .replace(/-x-/gi,".")
                .replace(/-p-/gi,":");

        //ProxyDomain的值在DomainMap裏面時，替換ProxyDomain的值為DomainMap裏面存儲的值。
        ProxyDomain = config.DomainMap[ProxyDomain] || ProxyDomain;

        return ProxyDomain;
    })()

    //如果用戶請求了主域名則返回提示。

    if (ProxyDomain === "" || ProxyDomain === url.host) {

        if (
            config.NotConfig &&
            (
                url.pathname.slice(0,6) !== "/panel" &&
                url.pathname.slice(0,4) !== "/api"
            )
        ) {
            return Response.redirect(
                url.protocol +
                "//" +
                url.host  +
                "/panel/",
                307)
        }

        if (url.pathname.match(/\/panel\//gi)) {
            let PanelRes = await fetch("https://kobe-koto.github.io/Auto-Proxy/"+url.pathname);
            let status = PanelRes.status;
            return new Response(PanelRes.body, {status,headers: PanelRes.headers});
        }

        if (url.pathname === "/api/check") {
            if (Password === GetQueryString(url, "password")) {
                return new Response("true", {headers: UniHeader});
            } else {
                return new Response("WrongPassword", {headers: UniHeader});
            }
        } else if (url.pathname === "/api/config") {
            if (Password !== GetQueryString(url, "password")) {
                return new Response("WrongPassword", {headers: UniHeader});
            }
            AutoProxySpace.put("_config", atob(GetQueryString(url,"b64config").replace(/%3D/gi,"=")))
            return new Response("true", {headers: UniHeader});
        } else if (url.pathname === "/api/sync") {
            if (Password !== GetQueryString(url, "password")) {
                return new Response("WrongPassword", {headers: UniHeader});
            }
            return new Response(JSON.stringify(config), {headers: UniHeader});
        }


        let ReturnUsage =
            (url.host.slice(-12) === ".workers.dev")
                ? i18nData.WorkersDevNotSupport
                : i18nData.ReturnUsage + url.host + "\r\n\r\n";

        return new Response("" +
            i18nData.Introduce +
            ReturnUsage +
            i18nData.Limit +
            i18nData.Deploy +
            i18nData.Copyright,
            { headers: UniHeader }
        );
    }

    isBlock(config,i18nData,request,ProxyDomain);

    //isBlock的過了的話就開始請求要訪問的位址了。
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
    if (config.DisableCache) {
        NewResponseHeaders.set("cache-control", "no-store");
    }

    NewResponseHeaders.set("access-control-allow-origin", "*");
    NewResponseHeaders.set("access-control-allow-credentials", "true");
    NewResponseHeaders.delete("content-security-policy");
    NewResponseHeaders.delete("content-security-policy-report-only");
    NewResponseHeaders.delete("clear-site-data");

    const ContentType = NewResponseHeaders.get("content-type");

    let ReplacedText;
    if (ContentType) {
        if (
            (
                ContentType.includes("text/html") ||
                ContentType.includes("application/javascript") ||
                ContentType.includes("text/plain") ||
                ContentType.includes("text/css")
            )
        ) {
            ReplacedText = await OriginalResponse.text()
            let OriginalDomainReplacer = new RegExp(ProxyDomain,"gi");
            ReplacedText = ReplacedText.replace(OriginalDomainReplacer, url.host);
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

//定義UniHeader。。。你一般不需要操心這個東西。
const UniHeader = {
    "Content-Type": "application/json;charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
};

function isBlock (config, i18nData, request, ProxyDomain) {
    //檢查用戶是不是在BlockRegion發起的請求。是則返回對應的403頁面。
    if (request.headers.get("CF-IPCountry") && config.BlockRegion && config.BlockRegion.includes(request.headers.get("CF-IPCountry"))) {
        return new Response(
            i18nData.DomainBlocked +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );
    }

    //檢查用戶的IP是否在BlockIP内。是則返回對應的403頁面。
    if (request.headers.get("cf-connecting-ip") && config.BlockIP && config.BlockIP.includes(request.headers.get("cf-connecting-ip"))) {
        return new Response(
            i18nData.IPBlocked +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );
    }

    //檢查用戶請求的ProxyDomain是否在BlockList内或AllowList外，是則返回403頁面。
    if (config.BlockList && config.BlockList.includes(ProxyDomain)) {

        let BlockListText = config.ShowAvailableList
            ? i18nData.BlockList.toString().replace(/,/, ", /r/n")
            : "";

        return new Response(
            i18nData.DomainBlocked +
            BlockListText +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );

    } else if (config.AllowList && !config.AllowList.includes(ProxyDomain)) {

        let AllowListText = config.ShowAvailableList
            ? i18nData.AllowList.toString().replace(/,/, ", /r/n")
            : "";

        return new Response(
            i18nData.DomainNotAllow +
            AllowListText +
            i18nData.Deploy,
            { headers: UniHeader, status:403 }
        );

    }
}

async function GetI18NData (request) {
    let LangCode =
        (request.headers.get("accept-language"))
            ? request.headers.get("accept-language")
                .split(";")[0]
                .split(",")[0]
            : "en"


    let LangData = await (async function (){
        let LangData = await AutoProxySpace.get(LangCode);
        if (LangData === null) {
            let LangDataUpToDate = await fetch(
                GetI18NDataAPI +
                LangCode +
                ".json"
            ).then(res => res.json())
                .catch(() => {});

            if (LangDataUpToDate === undefined) {
                LangDataUpToDate = await AutoProxySpace.get("en");
                LangDataUpToDate = JSON.parse(LangDataUpToDate);
                if (LangDataUpToDate === null) {
                    LangDataUpToDate = await fetch(
                        GetI18NDataAPI +
                        "en.json"
                    ).then(res => res.json())
                        .catch(() => {})
                    AutoProxySpace.put("en", JSON.stringify(LangDataUpToDate));
                    LangDataUpToDate.LangNotFindMsg = "\r\nLang \""+LangCode+"\" not find, use english instead"
                } else {
                    LangDataUpToDate.LangNotFindMsg = "\r\nLang \""+LangCode+"\" not find, use english instead"
                }
            } else {
                AutoProxySpace.put(LangCode, JSON.stringify(LangDataUpToDate));
            }
            return LangDataUpToDate;
        } else {
            return JSON.parse(LangData);
        }
    })()
    LangData.WorkersDevNotSupport = LangData.WorkersDevNotSupport || " Error ";
    LangData.ReturnUsage = LangData.ReturnUsage || " Error ";
    LangData.Introduce = LangData.Introduce || " Error ";
    LangData.Limit = LangData.Limit || " Error ";
    LangData.Deploy = LangData.Deploy || " Error ";
    LangData.Copyright = LangData.Copyright || " Error ";
    LangData.DomainBlocked = LangData.DomainBlocked || " Error ";
    LangData.DomainNotAllow = LangData.DomainNotAllow || " Error ";
    LangData.BlockList = LangData.BlockList || " Error ";
    LangData.AllowList = LangData.AllowList || " Error ";
    LangData.ConfError = LangData.ConfError || " Error ";
    LangData.RegionBlocked = LangData.RegionBlocked || " Error ";
    LangData.IPBlocked = LangData.IPBlocked || " Error ";

    return LangData;
}

function GetQueryString(url, name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = url.search.slice(1).match(reg);

    return (r !== null) ? r[2] : null;
}
