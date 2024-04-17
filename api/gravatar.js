const allowedReferrers = [
  "lruihao.cn",
  "gravatar-x.vercel.app",
  "-lrh-dev.vercel.app",
  "-cell-x.vercel.app",
  "localhost",
];

const upstream = "www.gravatar.com";

/**
 * whether the hostname is allowed
 * @param {String} hostname 
 * @returns 
 */
function isAllowedHost(hostname) {
  const regExp = new RegExp(allowedReferrers.join("|"), "g");
  // if hostname matches allowed referrers
  if (!hostname || regExp.test(hostname)) {
    return true
  }
  for (const referrer of allowedReferrers) {
    // if hostname ends with allowed referrers
    if (hostname.endsWith(referrer)) {
      return true
    }
  }
  return false
}

async function fetchAndApply(request) {
  let response = null;
  let url = new URL(request.url);

  url.host = upstream;
  let method = request.method;
  let request_headers = request.headers;
  let new_request_headers = new Headers(request_headers);
  new_request_headers.set("Host", upstream);
  new_request_headers.set("Referer", url.href);
  let original_response = await fetch(url.href, {
    method: method,
    headers: new_request_headers,
  });

  let original_response_clone = original_response.clone();
  let original_text = null;
  let response_headers = original_response.headers;
  let new_response_headers = new Headers(response_headers);
  let status = original_response.status;

  const hostname = (() => {
    try {
      return new URL(request.headers.get("Referer")).hostname;
    } catch (e) {
      return "";
    }
  })();
  if (!isAllowedHost(hostname)) {
    return new Response(`403 Forbidden: ${hostname}`, {
      headers: { "Content-Type": "text/html" },
      status: 403,
      statusText: "Forbidden",
    });
  }

  // new_response_headers.set("access-control-allow-origin", "https://lruihao.cn");
  new_response_headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  new_response_headers.set("Access-Control-Allow-Headers", "Content-Type");
  new_response_headers.set(
    "Cache-Control",
    "max-age=600, s-maxage=2592000, stale-while-revalidate"
  );
  new_response_headers.delete("link");

  original_text = original_response_clone.body;

  response = new Response(original_text, {
    status,
    headers: new_response_headers,
  });

  return response;
}

export const config = {
  runtime: "experimental-edge",
};

export default function (req) {
  return fetchAndApply(req);
}
