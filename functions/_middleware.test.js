import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { onRequest } from './_middleware.js';

/**
 * HTMLRewriter는 Cloudflare Workers 전역이라 Node(vitest)에는 없다.
 * 여기서는 체이닝(.on().on()...).transform(res)) 호출만 흉내 내는 최소 스텁을 주입해,
 * "meta가 있으면 HTMLRewriter를 실제로 태웠는가"만 관찰 가능하게 만든다.
 * transform은 받은 응답을 그대로 반환한다(내용 변환은 검증 대상이 아님 — routeMeta.test.js가
 * 메타 값 자체는 이미 검증함).
 */
function installHtmlRewriterStub() {
  const state = { transformCalled: false, transformedResponse: null };
  class HTMLRewriterStub {
    on() {
      return this;
    }
    transform(res) {
      state.transformCalled = true;
      state.transformedResponse = res;
      return res;
    }
  }
  globalThis.HTMLRewriter = HTMLRewriterStub;
  return state;
}

function makeContext(url, nextResponse) {
  return {
    request: new Request(url),
    next: async () => nextResponse,
  };
}

describe('functions/_middleware onRequest', () => {
  let rewriterState;

  beforeEach(() => {
    rewriterState = installHtmlRewriterStub();
  });

  afterEach(() => {
    delete globalThis.HTMLRewriter;
  });

  it('없는 에셋 요청에 SPA 폴백 HTML이 오면 진짜 404로 바꾼다', async () => {
    const fallbackHtml = new Response('<html>fallback</html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const context = makeContext('https://leecoachmom.com/assets/index-없는해시.js', fallbackHtml);

    const res = await onRequest(context);

    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('content-type')).toMatch(/^text\/plain/);
  });

  it('진짜 에셋 응답은 그대로 통과시키고 HTMLRewriter를 태우지 않는다', async () => {
    const body = 'console.log("real bundle")';
    const assetResponse = new Response(body, {
      status: 200,
      headers: { 'content-type': 'application/javascript' },
    });
    const context = makeContext('https://leecoachmom.com/assets/index-abc123.js', assetResponse);

    const res = await onRequest(context);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(body);
    expect(rewriterState.transformCalled).toBe(false);
  });

  it('비운영 호스트(staging)의 없는-에셋 404 응답에는 noindex 헤더가 붙는다', async () => {
    const fallbackHtml = new Response('<html>fallback</html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const context = makeContext(
      'https://staging.leecoach-front.pages.dev/assets/index-없는해시.js',
      fallbackHtml,
    );

    const res = await onRequest(context);

    expect(res.status).toBe(404);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('비운영 호스트(staging)의 HTML 경로 응답에도 noindex 헤더가 붙는다', async () => {
    const htmlResponse = new Response('<html><head><title>t</title></head></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const context = makeContext(
      'https://staging.leecoach-front.pages.dev/simulator',
      htmlResponse,
    );

    const res = await onRequest(context);

    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('운영 호스트에서는 같은 시나리오에도 noindex 헤더가 없다', async () => {
    const fallbackHtml = new Response('<html>fallback</html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const context = makeContext('https://leecoachmom.com/assets/index-없는해시.js', fallbackHtml);

    const res = await onRequest(context);

    expect(res.headers.get('x-robots-tag')).toBeNull();
  });

  it('제거된 글 경로는 301로 no-report-risks로 리다이렉트한다', async () => {
    const context = makeContext(
      'https://leecoachmom.com/guide/late-report-checklist',
      new Response(null, { status: 200 }),
    );

    const res = await onRequest(context);

    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://leecoachmom.com/guide/no-report-risks');
  });

  it('비운영 호스트의 301 리다이렉트에도 noindex 헤더가 붙는다', async () => {
    const context = makeContext(
      'https://staging.leecoach-front.pages.dev/guide/late-report-checklist',
      new Response(null, { status: 200 }),
    );

    const res = await onRequest(context);

    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://leecoachmom.com/guide/no-report-risks');
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('routeMeta에 없는 경로의 HTML 응답은 HTMLRewriter 없이 그대로 통과한다', async () => {
    const htmlResponse = new Response('<html><head><title>t</title></head></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const context = makeContext('https://leecoachmom.com/definitely-not-a-route', htmlResponse);

    const res = await onRequest(context);

    expect(rewriterState.transformCalled).toBe(false);
    expect(res.status).toBe(200);
  });

  it('routeMeta에 있는 경로의 HTML 응답은 HTMLRewriter로 처리된다', async () => {
    const htmlResponse = new Response('<html><head><title>t</title></head></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const context = makeContext('https://leecoachmom.com/simulator', htmlResponse);

    const res = await onRequest(context);

    expect(rewriterState.transformCalled).toBe(true);
    expect(res.status).toBe(200);
  });
});
