//例如我auto-proxy的域名是 anti-fw.example.org 和 auto-proxy.example.org，就照下面這樣設置。
const DomainReplaceKey = ["anti-fw","auto-proxy"];

addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request));
})
 
async function fetchAndApply(request) {
    let url = new URL(request.url);
    url_host = url.host;
    url.protocol = 'https:';
    url_end = url.pathname+url.search;

    //截取要proxy的位址。
    upstream_domain = url_host;
    for (i=0;i<DomainReplaceKey.length;i++) {
        upstream_domain = upstream_domain.split(DomainReplaceKey[i]+".")[0];
    }
    //替換 "-x-" 為 "."
    upstream_domain = upstream_domain.replace(".","").replace(/-x-/gi,".");

    if (upstream_domain == "") {
    	return new Response("Here is a Cloudflare Workers Auto-Proxy Script. \r\n\r\n" +
                            "Limits: 100,000 requests/day \r\n" + 
                	        "          1,000 requests/10 minutes \r\n\r\n" + 
                            "Usage: \r\n" +
                            "       Domain you wants request: example.org \r\n" +
                            "       Proxied Domain you should request: example-x-org." + url_host + "\r\n\r\n" + 
                            "Deploy your own! See at Github (https://github.com/kobe-koto/auto-proxy-cf)\r\n\r\n" + 
                            "Copyright NOW kobe-koto"
                            ,
        {
			headers: {
				'Content-Type':'application/json;charset=UTF-8',
				'Access-Control-Allow-Origin':'*',
				'Cache-Control':'no-store'
			}
	    });
    }

    replace_dict = {
        '$upstream_domain': '$custom_domain',
        '//$upstream_domain': ''
    }

    const user_agent = request.headers.get('user-agent');
 
    let response = null;

    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);
 
    new_request_headers.set('Host', upstream_domain);
    new_request_headers.set('Referer', upstream_domain);
 
    let original_response = await fetch(url.protocol+"//"+upstream_domain+url_end, {
        method: method,
        headers: new_request_headers
    })
 
    let original_response_clone = original_response.clone();
    let original_text = null;
    let response_headers = original_response.headers;
    let new_response_headers = new Headers(response_headers);
    let status = original_response.status;
 
    new_response_headers.set('access-control-allow-origin', '*');
    new_response_headers.set('access-control-allow-credentials', true);
    new_response_headers.delete('content-security-policy');
    new_response_headers.delete('content-security-policy-report-only');
    new_response_headers.delete('clear-site-data');
 
    const content_type = new_response_headers.get('content-type');
    console.log(content_type);

    
    if (content_type.match(/(text)/i)) {
        replaced_text = await original_response_clone.text()

        var ReplacerOriginalDomain = new RegExp(url_host,"gi");

        replaced_text = replaced_text.replace(ReplacerOriginalDomain, upstream_domain);
        console.log("replaced.")
    } else {
        replaced_text = await original_response_clone.blob()
    }

    response = new Response(replaced_text, {
        status,
        headers: new_response_headers
    })
    return response;
}
