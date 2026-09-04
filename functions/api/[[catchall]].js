export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = `https://pdf-compress-backend.onrender.com${url.pathname}${url.search}`;
  
  const init = {
    method: context.request.method,
    headers: context.request.headers,
    redirect: 'follow'
  };

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body;
  }

  return fetch(targetUrl, init);
}
