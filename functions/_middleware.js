import { normalizePathname, routeMeta } from './routeMeta.js';

/** 운영 호스트. 이외(test 도메인·pages.dev 프리뷰)는 색인을 막는다. */
const PRODUCTION_HOSTS = new Set(['leecoachmom.com', 'www.leecoachmom.com']);

/**
 * 테스트·프리뷰가 색인되면 운영과 중복 콘텐츠로 잡혀 검색 순위가 깎인다.
 * canonical이 운영 URL을 가리켜도 크롤링 자체는 막지 못하므로 헤더로 확실히 차단한다.
 * 스테이징은 운영 동작을 그대로 재현해야 하므로 리다이렉트·메타 주입은 건너뛰지 않고,
 * 완성된 응답에 헤더만 덧붙인다.
 */
function withNoIndex(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const path = normalizePathname(requestUrl.pathname);
  const isProduction = PRODUCTION_HOSTS.has(requestUrl.hostname);
  const finalize = (response) => (isProduction ? response : withNoIndex(response));

  // 제거된 글 — 무신고 리스크 가이드로 영구 이동
  if (path === '/guide/late-report-checklist') {
    return finalize(Response.redirect('https://leecoachmom.com/guide/no-report-risks', 301));
  }

  const res = await context.next();

  if (!res.headers.get('content-type')?.includes('text/html')) {
    return finalize(res);
  }

  const meta = routeMeta[path];

  if (!meta) {
    return finalize(res);
  }

  const url = `https://leecoachmom.com${path}`;

  return finalize(
    new HTMLRewriter()
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
      .transform(res),
  );
}
