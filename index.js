//在此處設置你的 host domain ，例如是 auto-proxy.example.org 的話可以設置為 auto-proxy.example.org ， auto-proxy.example 以及 auto-proxy 。
const DomainReplaceKey = ["anti-fw","anti-fw-cf","auto-proxy-test","auto-proxy"];

//在此處設定允許的網域和屏蔽的網域。請注意：這兩個列表不能共存，若要取消設定，請將對應的變量設定為 undefined 。
const AllowList = undefined;
const BlockList = ["114514.jp","114514.cn"];

//是否在請求被block的時候展示 可用/阻止 域名，Boolean類型，允許true和false。
const ShowAvailableList = true;

//定義 i18n 字串。
const i18n = {
    "zh": {
        "WorkersDevNotSupport": "!!!!!! Auto-Proxy 目前不支持 *.workers.dev 子域. !!!!!! \r\n\r\n",
        "ReturnUsage": "使用方式: 您想要請求的域名是: example.org \r\n" +
            "    那麽您應該請求: example-x-org.",
		"Introduce": "這是一個基於 Cloudflare Workers 的自動代理脚本. \r\n\r\n",
		"Limit": "請求限制: 每天 100,000 請求 \r\n" +
			"    每10分鐘 1,000 請求 \r\n\r\n",
		"Deploy": "部署你自己的 Auto Proxy ! 開源專案 Github 地址 (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
		"Copyright": "版權所有 kobe-koto, 使用 AGPL-3.0 許可證.\r\n"
    },
    "en": {
        "WorkersDevNotSupport": "!!!!!! Auto-Proxy does not support \" *.workers.dev \" Subdomain now. !!!!!!\r\n",
        "ReturnUsage": "Usage: Domain you wants request: example.org \r\n" +
            "    Proxies Domain you should request: example-x-org.",
		"Introduce": "Here is a Cloudflare Workers Auto-Proxy Script. \r\n\r\n",
		"Limit": "Limits: 100,000 requests/day \r\n" +
			"    1,000 requests/10 minutes \r\n\r\n",
		"Deploy": "Deploy your own! See at Github (https://github.com/kobe-koto/auto-proxy-cf).\r\n",
		"Copyright": "Copyright kobe-koto, Under AGPL-3.0 License.\r\n"
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
    },
}

addEventListener("fetch", event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {
	let i8nLang;
	let LangCode = request.headers.get('cf-ipcountry');
	if (LangCode !== null) {
		LangCode = LangCode.toString().toLowerCase();
	}
	if (LangCode === "zh" || LangCode === "hk" || LangCode === "tw" || LangCode === "mo") {
		i8nLang = i18n.zh;
	} else if (LangCode === "jp") {
        i8nLang = i18n.jp;
    } else {
		i8nLang = i18n.en;
	}

    let url = new URL(request.url);
    url.protocol = "http:";

    //截取要proxy的位址。
    ProxyDomain = url.host;
    for (i=0;i<DomainReplaceKey.length;i++) {
        ProxyDomain = ProxyDomain.split("."+DomainReplaceKey[i])[0];
    }

    //替換 "-x-" 為 "."
    ProxyDomain = ProxyDomain.replace(/-x-/gi,".");

    if (ProxyDomain === "" || ProxyDomain === url.host) {
        if (url.host.slice(-12) === ".workers.dev") {
            ReturnUsage = i8nLang.WorkersDevNotSupport;
        } else {
			ReturnUsage = i8nLang.ReturnUsage+url.host+"\r\n";
        }
        return new Response("" +
			i8nLang.Introduce +
            i8nLang.Copyright +
            ReturnUsage +
			i8nLang.Deploy +
			i8nLang.Copyright
            ,{
                headers: {
                    'Content-Type':'application/json;charset=UTF-8',
                    'Access-Control-Allow-Origin':'*',
                    'Cache-Control':'no-store'
                }
         });
    }

    if (BlockList !== undefined && AllowList === undefined && BlockList.includes(ProxyDomain)) {
        let BlockListText = "Block List | 阻止的域名: \r\n";
        if (ShowAvailableList) {
            let b;
            for (b in BlockList) {
                if (b.toString() === (BlockList.length - 1).toString()) {
                    BlockListText += " " + BlockList[b];
                } else {
                    BlockListText += " " + BlockList[b] + "\r\n";
                }
            }
        } else {
            BlockListText = "";
        }

        return new Response("Domain in BlockList.\r\n域名在 BlockList 内。 \r\n\r\n" + BlockListText, {
                headers:{
                    "Content-Type":"text/plain;charset=UTF-8",
                    'Access-Control-Allow-Origin':'*',
                    'Cache-Control':'no-store'
                },
                status:403
            });
    } else if (BlockList === undefined && AllowList !== undefined && !AllowList.includes(ProxyDomain)) {
        let AllowListText = "Allow List | 允許的域名: \r\n";
        if (ShowAvailableList) {
            let b;
            for (b in AllowList) {
                if (b.toString() === (AllowList.length - 1).toString()) {
                    AllowListText += " " + AllowList[b];
                } else {
                    AllowListText += " " + AllowList[b] + "\r\n";
                }
            }
        } else {
            AllowListText = "";
        }

        return new Response("Domain isn't in AllowList.\r\n域名不在 AllowList 内。 \r\n\r\n" + AllowListText, {
            headers:{
                "Content-Type":"text/plain;charset=UTF-8",
                'Access-Control-Allow-Origin':'*',
                'Cache-Control':'no-store'
            },
            status:403
        });
    } else if ((BlockList !== undefined) && (AllowList !== undefined)){
        return new Response("Configuration error. AllowList and BlockList cannot be configured at the same time.\r\n"+
            "配置錯誤。AllowList 和 BlockList 不能在同一時間被配置。"
            ,{
                headers: {
                    'Content-Type':'application/json;charset=UTF-8',
                    'Access-Control-Allow-Origin':'*',
                    'Cache-Control':'no-store'
                }
            });
    }


    //let response = null;

    let NewRequestHeaders = new Headers(request.headers);

    NewRequestHeaders.set("Host", ProxyDomain);
    NewRequestHeaders.set("Referer", ProxyDomain);

    let OriginalResponse = await fetch(url.protocol+"//"+ProxyDomain+url.pathname+url.search, {
        method: request.method,
        headers: NewRequestHeaders
    })

    let OriginalResponseClone = OriginalResponse.clone();

    let NewResponseHeaders = new Headers(OriginalResponse.headers);
    let status = OriginalResponse.status;

    NewResponseHeaders.set("access-control-allow-origin", "*");
    NewResponseHeaders.set("access-control-allow-credentials", "true");
    NewResponseHeaders.delete("content-security-policy");
    NewResponseHeaders.delete("content-security-policy-report-only");
    NewResponseHeaders.delete("clear-site-data");

    const ContentType = NewResponseHeaders.get("content-type");


    if (ContentType.match(/(text)/i)) {
        ReplacedText = await OriginalResponseClone.text()
        const ReplacerOriginalDomain = new RegExp(url.host,"gi");
        ReplacedText = ReplacedText.replace(ReplacerOriginalDomain, ProxyDomain);
    } else {
        ReplacedText = await OriginalResponseClone.blob()
    }

    response = new Response(ReplacedText, {
        status,
        headers: NewResponseHeaders
    })
    return response;
}
