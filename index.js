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

//域名映射表。例如" {'github': 'github.com'} " 的 github.example.org => github.com 。
const DomainMap = {
    "github": "github.com"
}

addEventListener("fetch", event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {
    let RegionCode = (function () {
        if (
            request.headers.get("cf-ipcountry") !== null &&
            !!i18n[request.headers.get("cf-ipcountry").toString().toLowerCase()]
        ) {
            return request.headers.get("cf-ipcountry").toString().toLowerCase();
        } else {
            return "en";
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
                return i18n[RegionCode].WorkersDevNotSupport;
            } else {
                return i18n[RegionCode].ReturnUsage+url.host+"\r\n\r\n";
            }
        })()

        return new Response("" +
            i18n[RegionCode].Introduce +
            ReturnUsage +
            i18n[RegionCode].Limit +
            i18n[RegionCode].Deploy +
            i18n[RegionCode].Copyright,
            { headers: UniHeader }
        );
    }

    //檢查用戶是不是在BlockRegion發起的請求。是則返回對應的403頁面。
    if (request.headers.get("cf-ipcountry") !== null && !!BlockRegion && BlockRegion.includes(request.headers.get("cf-ipcountry"))) {
        return new Response(
            i18n[RegionCode].DomainBlocked +
            i18n[RegionCode].Deploy,
            { headers: UniHeader, status:403 }
        );
    }

    //檢查用戶的IP是否在BlockIP内。是則返回對應的403頁面。
    if (request.headers.get("cf-connecting-ip") !== null && !!BlockIP && BlockIP.includes(request.headers.get("cf-connecting-ip"))) {
        return new Response(
            i18n[RegionCode].IPBlocked +
            i18n[RegionCode].Deploy,
            { headers: UniHeader, status:403 }
        );
    }

    //檢查用戶請求的ProxyDomain是否在BlockList内或AllowList外，是則返回403頁面。
    if (BlockList !== undefined && AllowList === undefined && BlockList.includes(ProxyDomain)) {

        let BlockListText = (function (){
            if (ShowAvailableList) {
                let ReturnValue = i18n[RegionCode].BlockList;
                for (let b in BlockList) {
                    ReturnValue += " " + BlockList[b] + "\r\n";
                }
                return ReturnValue;
            } else {
                return "";
            }
        })()

        return new Response(
            i18n[RegionCode].DomainBlocked +
            BlockListText +
            i18n[RegionCode].Deploy,
            { headers: UniHeader, status:403 }
        );

    } else if (BlockList === undefined && AllowList !== undefined && !AllowList.includes(ProxyDomain)) {


        let AllowListText = (function (){
            if (ShowAvailableList) {
                let ReturnValue = i18n[RegionCode].AllowList;
                for (let b in AllowList) {
                    ReturnValue += " " + AllowList[b] + "\r\n";
                }
                return ReturnValue;
            } else {
                return "";
            }
        })()

        return new Response(
            i18n[RegionCode].DomainNotAllow +
            AllowListText +
            i18n[RegionCode].Deploy,
            { headers: UniHeader, status:403 }
        );

    } else if ((BlockList !== undefined) && (AllowList !== undefined)){
        //（靠北哦怎麽會有人這樣子搞的）
        return new Response(i18n[RegionCode].ConfError,{
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

//定義 i18n 字串。
const i18n = {
    "cn": {
        "WorkersDevNotSupport": "!!!!!! Auto-Proxy 目前不支持 *.workers.dev 子域. !!!!!! \r\n\r\n",
        "ReturnUsage": "使用方式: 您想要请求的域名是: example.org \r\n" +
            "    那么您应该请求: example-x-org.",
        "Introduce": "这是一个基于 Cloudflare Workers 的自动代理脚本. \r\n\r\n",
        "Limit": "请求限制: 每天 100,000 请求 \r\n" +
            "    每10分钟 1,000 请求 \r\n\r\n",
        "Deploy": "部署你自己的 Auto Proxy ! Github 地址 (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
        "Copyright": "版权所有 kobe-koto, 使用 AGPL-3.0 许可证.\r\n",
        "DomainBlocked": "域名在 BlockList 内. \r\n\r\n",
        "DomainNotAllow": "域名不在 AllowList 内. \r\n\r\n",
        "BlockList": "阻止的域名: \r\n",
        "AllowList": "允许的域名: \r\n",
        "ConfError": "配置错误. AllowList 和 BlockList 不能在同一时间被配置. \r\n",
        "RegionBlocked": "您所在的地区已经被此站点屏蔽. ",
        "IPBlocked": "您的 IP 位址已经被此站点屏蔽. "
    },
    "tw": {
        "WorkersDevNotSupport": "!!!!!! Auto-Proxy 目前不支持 *.workers.dev 子域. !!!!!! \r\n\r\n",
        "ReturnUsage": "使用方式: 您想要請求的域名是: example.org \r\n" +
            "    那麽您應該請求: example-x-org.",
        "Introduce": "這是一個基於 Cloudflare Workers 的自動代理脚本. \r\n\r\n",
        "Limit": "請求限制: 每天 100,000 請求 \r\n" +
            "    每10分鐘 1,000 請求 \r\n\r\n",
        "Deploy": "部署你自己的 Auto Proxy ! 開源專案 Github 地址 (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
        "Copyright": "版權所有 kobe-koto, 使用 AGPL-3.0 許可證.\r\n",
        "DomainBlocked": "域名在 BlockList 内. \r\n\r\n",
        "DomainNotAllow": "域名不在 AllowList 内. \r\n\r\n",
        "BlockList": "阻止的域名: \r\n",
        "AllowList": "允許的域名: \r\n",
        "ConfError": "配置錯誤. AllowList 和 BlockList 不能在同一時間被配置. \r\n",
        "RegionBlocked": "您所在的地區已經被此站點屏蔽. ",
        "IPBlocked": "您的 IP 位址已經被此站點屏蔽. "
    },
    "hk": {
        "WorkersDevNotSupport": "!!!!!! Auto-Proxy 目前不支持 *.workers.dev 子域. !!!!!! \r\n\r\n",
        "ReturnUsage": "使用方式: 您想要請求的域名是: example.org \r\n" +
            "    那麽您應該請求: example-x-org.",
        "Introduce": "這是一個基於 Cloudflare Workers 的自動代理脚本. \r\n\r\n",
        "Limit": "請求限制: 每天 100,000 請求 \r\n" +
            "    每10分鐘 1,000 請求 \r\n\r\n",
        "Deploy": "部署你自己的 Auto Proxy ! 開源專案 Github 地址 (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
        "Copyright": "版權所有 kobe-koto, 使用 AGPL-3.0 許可證.\r\n",
        "DomainBlocked": "域名在 BlockList 内. \r\n\r\n",
        "DomainNotAllow": "域名不在 AllowList 内. \r\n\r\n",
        "BlockList": "阻止的域名: \r\n",
        "AllowList": "允許的域名: \r\n",
        "ConfError": "配置錯誤. AllowList 和 BlockList 不能在同一時間被配置. \r\n",
        "RegionBlocked": "您所在的地區已經被此站點屏蔽. ",
        "IPBlocked": "您的 IP 位址已經被此站點屏蔽. "
    },
    "mo": {
        "WorkersDevNotSupport": "!!!!!! Auto-Proxy 目前不支持 *.workers.dev 子域. !!!!!! \r\n\r\n",
        "ReturnUsage": "使用方式: 您想要請求的域名是: example.org \r\n" +
            "    那麽您應該請求: example-x-org.",
        "Introduce": "這是一個基於 Cloudflare Workers 的自動代理脚本. \r\n\r\n",
        "Limit": "請求限制: 每天 100,000 請求 \r\n" +
            "    每10分鐘 1,000 請求 \r\n\r\n",
        "Deploy": "部署你自己的 Auto Proxy ! 開源專案 Github 地址 (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
        "Copyright": "版權所有 kobe-koto, 使用 AGPL-3.0 許可證.\r\n",
        "DomainBlocked": "域名在 BlockList 内. \r\n\r\n",
        "DomainNotAllow": "域名不在 AllowList 内. \r\n\r\n",
        "BlockList": "阻止的域名: \r\n",
        "AllowList": "允許的域名: \r\n",
        "ConfError": "配置錯誤. AllowList 和 BlockList 不能在同一時間被配置. \r\n",
        "RegionBlocked": "您所在的地區已經被此站點屏蔽. ",
        "IPBlocked": "您的 IP 位址已經被此站點屏蔽. "
    },
    "en": {
        "WorkersDevNotSupport": "!!!!!! Auto-Proxy does not support \" *.workers.dev \" Subdomain now. !!!!!!\r\n",
        "ReturnUsage": "Usage: Domain you wants request: example.org \r\n" +
            "    Proxies Domain you should request: example-x-org.",
        "Introduce": "Here is a Cloudflare Workers Auto-Proxy Script. \r\n\r\n",
        "Limit": "Limits: 100,000 requests/day \r\n" +
            "    1,000 requests/10 minutes \r\n\r\n",
        "Deploy": "Deploy your own! See at Github (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
        "Copyright": "Copyright kobe-koto, Under AGPL-3.0 License.\r\n",
        "DomainBlocked": "Domain in BlockList. \r\n\r\n",
        "DomainNotAllow": "Domain isn't in AllowList. \r\n\r\n",
        "BlockList": "Block List: \r\n",
        "AllowList": "Allow List: \r\n",
        "ConfError": "Configuration error. AllowList and BlockList cannot be configured at the same time.\r\n \r\n",
        "RegionBlocked": "Your region has been blocked by this site. ",
        "IPBlocked": "Your IP address has been blocked by this site. "
    },
    "jp": {
        "WorkersDevNotSupport": "!!!!!!! 現在、Auto-Proxy は *.workers.dev サブドメインに対応していません. !!!!!!\r\n\r\n",
        "ReturnUsage": "使用方法: リクエストしたいドメインは: example.org \r\n" +
            "    リクエストする必要があるプロキシ ドメイン: example-x-org.",
        "Introduce": "これは Cloudflare Workers をベースとした Auto Proxy スクリプトです。\r\n\r\n",
        "Limit": "リクエストの上限: 100,000 リクエスト/24 hours, \r\n" +
            "    1,000 リクエスト/10 minutes. \r\n\r\n",
        "Deploy": "独自の Auto Proxy を導入する! オープンソースプロジェクトの Github アドレス (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
        "Copyright": "著作権者 kobe-koto, ライセンスは AGPL-3.0 です. \r\n",
        "DomainBlocked": "ドメイン名は 「BlockList」 にあります. \r\n\r\n",
        "DomainNotAllow": "ドメイン名が 「AllowList」 にありません. \r\n\r\n",
        "BlockList": "ブロックされたドメイン: \r\n",
        "AllowList": "許可されたドメイン: \r\n",
        "ConfError": "設定エラーです. AllowList と BlockList を同時に構成することはできません. \r\n",
        "RegionBlocked": "お住まいの地域はこのサイトからブロックされています. ",
        "IPBlocked": "あなたの IP アドレスは、このサイトによってブロックされています. "
    }
}

//定義UniHeader。。。你一般不需要操心這個東西。
const UniHeader = {
    "Content-Type": "application/json;charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
};
