import { normalizePathname, routeMeta } from './routeMeta.js';

export async function onRequest(context) {
  const res = await context.next();

  if (!res.headers.get('content-type')?.includes('text/html')) {
    return res;
  }

  const path = normalizePathname(new URL(context.request.url).pathname);
  const meta = routeMeta[path];

  if (!meta) {
    return res;
  }

  const url = `https://leecoachmom.com${path}`;

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(meta.title);
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute('content', meta.description);
      },
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute('content', meta.ogTitle);
      },
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute('content', meta.description);
      },
    })
    .on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute('content', url);
      },
    })
    .on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute('href', url);
      },
    })
    .transform(res);
}
