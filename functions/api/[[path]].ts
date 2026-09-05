export async function onRequest(context: {
  request: Request;
  params: { path: string[] };
}): Promise<Response> {
  const url = new URL(context.request.url);
  const targetUrl = `https://pdf-compress-backend.onrender.com${url.pathname}${url.search}`;

  const forwardHeaders = new Headers(context.request.headers);
  forwardHeaders.set('host', 'pdf-compress-backend.onrender.com');

  const init: RequestInit = {
    method: context.request.method,
    headers: forwardHeaders,
    redirect: 'follow',
  };

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body;
    // @ts-ignore
    init.duplex = 'half';
  }

  try {
    const response = await fetch(targetUrl, init);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('access-control-allow-origin', '*');
    newHeaders.set('access-control-allow-credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: 'Proxy error to backend', message: err?.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
