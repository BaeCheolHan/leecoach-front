import { isStaticAssetPath, normalizePathname, routeMeta } from './routeMeta.js';

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

  // Pages는 없는 경로에 SPA 폴백으로 index.html을 200 응답한다. 실측:
  // /assets/존재하지않는파일.js → 200 + text/html + cache-control: max-age=14400.
  // 그대로 두면 배포 전파 중 방문한 브라우저가 이 HTML을 엔트리 번들 URL에 4시간
  // 캐시해버려 React가 부팅하지 못하고 화면이 빈다(RootErrorBoundary는 마운트 전이라
  // 못 잡음, 새로고침도 캐시라 안 풀림). 에셋 경로인데 HTML이 왔다면 진짜 404로
  // 바꾸고 캐시를 금지해, 배포가 끝난 뒤 재요청하면 정상 에셋을 받도록 한다.
  if (isStaticAssetPath(path)) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
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
