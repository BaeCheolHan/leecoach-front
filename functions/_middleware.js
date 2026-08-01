import { normalizePathname, routeMeta } from './routeMeta.js';

export async function onRequest(context) {
  const path = normalizePathname(new URL(context.request.url).pathname);

  // 제거된 글 — 무신고 리스크 가이드로 영구 이동
  if (path === '/guide/late-report-checklist') {
    return Response.redirect('https://leecoachmom.com/guide/no-report-risks', 301);
  }

  const res = await context.next();

  if (!res.headers.get('content-type')?.includes('text/html')) {
    return res;
  }

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
