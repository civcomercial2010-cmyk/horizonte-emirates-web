/**
 * Sirve / con 200 interno (index.html) sin el 301 del router de Workers Assets.
 * Solo corre con run_worker_first: ["/"]; el resto de rutas va directo a ASSETS.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '') {
      const indexUrl = new URL('/index.html', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }
    return env.ASSETS.fetch(request);
  },
};
