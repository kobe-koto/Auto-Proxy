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
        upstream_domain = upstream_domain.split("."+DomainReplaceKey[i]+".")[0];
    }
    //替換 "-x-" 為 "."
    upstream_domain = upstream_domain.replace(/-x-/gi,".");

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
    original_text = await replace_response_text(original_response_clone, upstream_domain, url_host);
    response = new Response(original_text, {
        status,
        headers: new_response_headers
    })
    return response;
}
 
async function replace_response_text(response, upstream_domain, host_name) {
    let text = await response.text()
 
    var i, j;
    for (i in replace_dict) {
        j = replace_dict[i]
        if (i == '$upstream') {
            i = upstream_domain
        } else if (i == '$custom_domain') {
            i = host_name
        }
 
        if (j == '$upstream') {
            j = upstream_domain
        } else if (j == '$custom_domain') {
            j = host_name
        }
 
        let re = new RegExp(i, 'g')
        text = text.replace(re, j);
    }
    return text;
}
