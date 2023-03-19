// your password.
const Password = "LOL"


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
        } // base config, or config it yourself then you can throw KV away
    );

    let url = new URL(request.url);
    url.protocol = (config.URLProtocol || "https") + ":";

    //定義要proxy的位址。
    let ProxyDomain = (function () {
        let ProxyDomain = url.host;

        //用for從url.host裏面去掉不要的主域名
        for (let i=0;i<config.HostDomain.length;i++) {
            ProxyDomain = ProxyDomain.split(`.${config.HostDomain[i]}`)[0];
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
        return await HandleHostDomainRequest(ProxyDomain, url, config, request)
    }

    let BlockedStatus = await isBlock(config, request, ProxyDomain);
    if (BlockedStatus !== false) {
        return new Response(
            BlockedStatus,
            { headers: UniHeader, status:403 }
        );
    }



    let NewRequestHeaders = new Headers(request.headers);
    // define headers
    NewRequestHeaders.set("Host", ProxyDomain);
    NewRequestHeaders.set("Referer", ProxyDomain);
    // 去除涉及用戶訊息的CF提供的標頭
    NewRequestHeaders.delete("cf-connecting-ip");
    NewRequestHeaders.delete("cf-IPCountry");
    NewRequestHeaders.delete("cf-ray");
    NewRequestHeaders.delete("cf-visitor");
    NewRequestHeaders.delete("x-real-ip");
    NewRequestHeaders.delete("host");

    let OriginalResponse = await fetch(`${url.protocol}//${ProxyDomain}${url.pathname}${url.search}`, {
        method: request.method,
        headers: NewRequestHeaders
    })

    if (NewRequestHeaders.get("Upgrade") && NewRequestHeaders.get("Upgrade").toLowerCase() === "websocket") {
        return OriginalResponse;
    }


    let NewResponseHeaders = new Headers(OriginalResponse.headers);
    const { status } = OriginalResponse;
    const ContentType = NewResponseHeaders.get("content-type");

    //如果用戶配置了强制禁用緩存則設置Cache-Control標頭為no-store。
    if (config.DisableCache) {
        NewResponseHeaders.set("cache-control", "no-store");
    }
    NewResponseHeaders.set("access-control-allow-origin", url.host);
    NewResponseHeaders.set("access-control-allow-credentials", "true");
    NewResponseHeaders.delete("content-security-policy");
    NewResponseHeaders.delete("content-security-policy-report-only");
    NewResponseHeaders.delete("clear-site-data");
    // replace cookie domain to target domain.
    NewResponseHeaders.set(
        "set-cookie",
        NewResponseHeaders.get("set-cookie")
            .replace(
                (new RegExp(ProxyDomain,"gi")),
                url.hostname
            )
    )


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
        if (ContentType.includes("text/html") && config.WarningEnabled) {
            ReplacedText = ReplacedText + WarningHTML
        }
    } else {
        ReplacedText = OriginalResponse.body
    }

    return new Response(ReplacedText, {
        status,
        headers: NewResponseHeaders
    });
}




async function HandleHostDomainRequest(ProxyDomain, url, config, request) {
    if (
        config.NotConfig &&
        url.pathname.slice(0,6) !== "/panel" &&
        url.pathname.slice(0,4) !== "/api"
    ) {
        return Response.redirect(`${url.protocol}//${url.host}/panel/`, 307)
    }

    // handle panel request.
    if (url.pathname.toLowerCase().startsWith("/panel")) {
        let PanelRes = await fetch(`https://kobe-koto.github.io/Auto-Proxy/${url.pathname}`);
        let status = PanelRes.status;
        return new Response(PanelRes.body, {status ,headers: PanelRes.headers});
    }
    if (url.pathname.toLowerCase().startsWith("/api")) {
        return HandleAPIRequest(url, config)
    }

    let i18nData = await GetI18NData (
        request.headers.get("accept-language")
            ? request.headers.get("accept-language")
                .split(";")[0]
                .split(",")[0]
            : "en"
    );

    return new Response("" +
        i18nData.Introduce +
        (
            url.host.endsWith(".workers.dev")
                ? i18nData.WorkersDevNotSupport
                : i18nData.ReturnUsage + url.host + "\r\n\r\n"
        ) +
        i18nData.Limit +
        i18nData.Deploy +
        i18nData.Copyright,
        { headers: UniHeader }
    );
}
function HandleAPIRequest (url, config) {
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
}


/**
 * check if need to return Block info.
 * @returns {String|Boolean: false}
 */
async function isBlock (config, request, ProxyDomain) {
    let BlockedObject = {},
        i18nData = null,
        BlockedStatus = false;

    // 檢查用戶的 Region 是否在 BlockRegion 内.
    BlockedObject.RegionBlocked = config.BlockRegion && request.headers.get("CF-IPCountry") && config.BlockRegion.includes(request.headers.get("CF-IPCountry"));
    // 檢查用戶的 IP 是否在 BlockIP 内.
    BlockedObject.IPBlocked = config.BlockIP && request.headers.get("cf-connecting-ip") && config.BlockIP.includes(request.headers.get("cf-connecting-ip"));

    // 檢查用戶請求的 ProxyDomain 是否在 BlockList 内/ AllowList 外.
    // note: due auto-proxy panel's develop, BlockList and AllowList cannot defined together now.
    BlockedObject.DomainBlocked = config.BlockList && config.BlockList.includes(ProxyDomain);
    BlockedObject.DomainNotAllow = config.AllowList && !config.AllowList.includes(ProxyDomain)



    for (let i in BlockedObject) {
        if (BlockedObject[i] === true) {
            i18nData = await GetI18NData (
                request.headers.get("accept-language")
                    ? request.headers.get("accept-language")
                        .split(";")[0]
                        .split(",")[0]
                    : "en"
            );
        }
    }
    if (i18nData !== null) {
        BlockedStatus = ""
        for (let i in BlockedObject) {
            if (BlockedObject[i] === true) {
                BlockedStatus += i18nData[i];
                //if (i.match(/(DomainBlocked|DomainNotAllow)/))
                if (i === "DomainBlocked") {
                    BlockedStatus += config.ShowAvailableList
                        ? config.BlockList.toString().replace(/,/, ", /r/n")
                        : "";
                } else if (i === "DomainNotAllow") {
                    BlockedStatus += config.ShowAvailableList
                        ? config.AllowList.toString().replace(/,/, ", /r/n")
                        : "";
                }
            }
        }
        BlockedStatus += i18nData.Deploy;
    }
    return BlockedStatus;
}

/**
 * Get i18n data via KV or Github.
 * @param LangCode {String} like "zh-cn", "zh-tw" and "en".
 * @returns {Object}
 */
async function GetI18NData (LangCode) {
    // try to get the i18n data in KV.
    let LangData = await AutoProxySpace.get(LangCode);

    //if exist then return
    if (LangData !== null) {
        return JSON.parse(LangData);
    }

    // if not exist
    // fetch the latest i18n data.
    LangData = await fetch(`${GetI18NDataAPI}${LangCode}.json`)
        .then(res => res.json())
        .catch(() => undefined);
    // if data correct then cache it in KV.
    if (LangData !== undefined) {
        AutoProxySpace.put(LangCode, JSON.stringify(LangData));
        return LangData;
    }
    // if data not exist at github, get the EN data by default.
    return GetI18NData("en")

    /**
     * @namespace LangData
     * @property WorkersDevNotSupport {String}
     * @property ReturnUsage {String}
     * @property Introduce {String}
     * @property Limit {String}
     * @property Deploy {String}
     * @property Copyright {String}
     * @property DomainBlocked {String}
     * @property DomainNotAllow {String}
     * @property BlockList {String}
     * @property AllowList {String}
     * @property ConfError {String}
     * @property RegionBlocked {String}
     * @property IPBlocked {String}
     */
}

/**
 *
 * @param url {String}
 * @param name {String}
 * @returns {string|null}
 * @constructor
 */
function GetQueryString(url, name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = url.search.slice(1).match(reg);

    return !!r ? r[2] : null;
}

AutoProxySpace = AutoProxySpace || {};

//定義UniHeader
const UniHeader = {
    "Content-Type": "application/json;charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
};

const WarningHTML = `<div style="position: fixed;bottom: 10px;right: 0;background-color: rgba(255,255,255,0.75);color: #232323;padding: 20px 10px 20px 20px;border-top-left-radius: 25px;border-bottom-left-radius: 25px;font-size: large;max-width: 25%;backdrop-filter: blur(15px);">Please note this site is NOT affiliated with %url.host, It is a proxy Site. <a href="javascript:void(0)" onclick="this.parentElement.remove()">Close</a></div>`

//定義要從何處獲取i18n資料.
let GetI18NDataAPI = "https://github.com/kobe-koto/Auto-Proxy/raw/main/i18n/";
