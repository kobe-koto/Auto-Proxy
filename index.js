//例如我auto-proxy的域名是 anti-fw.example.org 和 auto-proxy.example.org，就照下面這樣設置。
const DomainReplaceKey = ["anti-fw","auto-proxy-test"];

addEventListener("fetch", event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {
    let url = new URL(request.url);
    url.protocol = "http:";

    //截取要proxy的位址。
    ProxyDomain = url.host;
    for (i=0;i<DomainReplaceKey.length;i++) {
        ProxyDomain = ProxyDomain.split(DomainReplaceKey[i]+".")[0];
    }
    //替換 "-x-" 為 "."
    ProxyDomain = ProxyDomain.replace(".","").replace(/-x-/gi,".");

    if (ProxyDomain === "") {
        return new Response(
            "Here is a Cloudflare Workers Auto-Proxy Script. \r\n\r\n" +
            "Limits: 100,000 requests/day \r\n" +
            "          1,000 requests/10 minutes \r\n\r\n" +
            "Usage: \r\n" +
            "       Domain you wants request: example.org \r\n" +
            "       Proxied Domain you should request: example-x-org." + url.host + "\r\n\r\n" +
            "Deploy your own! See at Github (https://github.com/kobe-koto/auto-proxy-cf)\r\n\r\n" +
            "Copyright NOW kobe-koto"
            , {
                headers: {
                    "Content-Type":"application/json;charset=UTF-8",
                    "Access-Control-Allow-Origin":"*",
                    "Cache-Control":"no-store"
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
