/**
 * Pages Function: sirve / con 200 (index.html) sin 301.
 * Complementa worker/index.js para deploys Git que solo activan Functions.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const indexReq = new Request(new URL('/index.html', url.origin), context.request);
  const res = context.env.ASSETS
    ? await context.env.ASSETS.fetch(indexReq)
    : await fetch(indexReq);
  const headers = new Headers(res.headers);
  headers.set('X-HE-Root', 'pages-fn');
  return new Response(res.body, { status: 200, headers });
}
