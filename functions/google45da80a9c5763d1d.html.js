export async function onRequest() {
  return new Response('google-site-verification: google45da80a9c5763d1d.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}
