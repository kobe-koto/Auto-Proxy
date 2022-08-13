//在此處設置你的 host domain ，例如是 auto-proxy.example.org 的話可以設置為 auto-proxy.example.org ， auto-proxy.example 以及 auto-proxy 。
const DomainReplaceKey = ["anti-fw","anti-fw-cf","auto-proxy-test","auto-proxy"];

//在此處設定允許的網域和屏蔽的網域。請注意：這兩個列表不能共存，若要取消設定，請將對應的變量設定為 undefined 。
const AllowList = undefined;
const BlockList = ["114514.jp"];

//是否在請求被block的時候展示 可用/阻止 域名，Boolean類型，允許true和false。
const ShowAvailableList = true;

addEventListener("fetch", event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {
    let url = new URL(request.url);
    url.protocol = "http:";

    //截取要proxy的位址。
    ProxyDomain = url.host;
    for (i=0;i<DomainReplaceKey.length;i++) {
        ProxyDomain = ProxyDomain.split("."+DomainReplaceKey[i])[0];
    }

    //替換 "-x-" 為 "."
    ProxyDomain = ProxyDomain.replace(/-x-/gi,".");

    if (ProxyDomain === "") {
        if (url.host.slice(-12) === ".workers.dev") {
            ReturnUsage = "!!!!!! Auto-Proxy does not support \" *.workers.dev \" Subdomain now. !!!!!! \r\n\r\n";
        } else {
            ReturnUsage = "Usage: Domain you wants request: example.org \r\n" +
                "       Proxies Domain you should request: example-x-org." + url.host + "\r\n\r\n";
        }
        return new Response("Here is a Cloudflare Workers Auto-Proxy Script. \r\n\r\n" +
            "Limits: 100,000 requests/day \r\n" +
            "          1,000 requests/10 minutes \r\n\r\n" +
            ReturnUsage +
            "Deploy your own! See at Github (https://github.com/kobe-koto/auto-proxy-cf)\r\n\r\n" +
            "Copyright NOW kobe-koto"
            ,{
                headers: {
                    'Content-Type':'application/json;charset=UTF-8',
                    'Access-Control-Allow-Origin':'*',
                    'Cache-Control':'no-store'
                }
         });
    }

    if ((BlockList !== undefined) && (AllowList === undefined)) {
        var BlockListText = "";
        var b;
        for (b in BlockList) {
            text += BlockList[b] + " || ";
        }
        text=text.slice(0,-" || ".length)

        return new Response("Domain in BlockList. \r\n\r\n Block List: \r\n" + text
            ,{
                headers: {
                    'Content-Type':'application/json;charset=UTF-8',
                    'Access-Control-Allow-Origin':'*',
                    'Cache-Control':'no-store'
                }
            });
    } else if ((BlockList === undefined) && (AllowList !== undefined)) {
        var AllowListText = "";
        var a;
        for (a in AllowList) {
            text += AllowList[a] + " || ";
        }
        text=text.slice(0,-" || ".length)

        return new Response("Domain isn't in BlockList. \r\n\r\n Allow List: \r\n" + text
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

    const content_type = NewResponseHeaders.get("content-type");


    if (content_type.match(/(text)/i)) {
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
