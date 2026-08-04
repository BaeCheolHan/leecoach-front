import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// index.html은 정적 HTML이라 vitest(jsdom)로 직접 실행·렌더할 수 없다.
// 대신 배포 전파 중 흰 화면 방지 장치(정적 폴백 마크업 + 인라인 부트 가드 스크립트)가
// 파일에서 삭제·손상되지 않았는지 내용 기반으로 회귀 검사한다.
const indexHtmlPath = fileURLToPath(new URL('../index.html', import.meta.url));
const indexHtml = readFileSync(indexHtmlPath, 'utf-8');

const mainTsxPath = fileURLToPath(new URL('./main.tsx', import.meta.url));
const mainTsx = readFileSync(mainTsxPath, 'utf-8');

describe('index.html 부트 가드', () => {
  it('#root가 비어 있지 않다 (정적 로딩 폴백 마크업 존재)', () => {
    const rootMatch = indexHtml.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/);
    expect(rootMatch).not.toBeNull();
    const rootInner = rootMatch![1];
    expect(rootInner.trim().length).toBeGreaterThan(0);
    // CSS가 함께 404날 수 있으므로 최소 표시는 인라인 style로 보장돼야 한다.
    expect(rootInner).toMatch(/style="/);
  });

  it('인라인 부트 가드 스크립트가 캡처 단계에서 error 이벤트를 감지한다', () => {
    expect(indexHtml).toContain("addEventListener(\n          'error',");
    // 세 번째 인자(useCapture)로 true를 넘겨야 리소스 로드 에러를 잡을 수 있다.
    expect(indexHtml).toMatch(/addEventListener\(\s*['"]error['"][\s\S]*?true\s*,?\s*\);/);
  });

  it('/assets/ 경로의 script·link[rel=stylesheet] 실패만 대상으로 한다', () => {
    expect(indexHtml).toContain('/assets/');
    expect(indexHtml).toContain("target.tagName === 'SCRIPT'");
    expect(indexHtml).toContain("target.tagName === 'LINK'");
    expect(indexHtml).toContain('stylesheet');
  });

  it('최대 재시도 횟수가 유한하다 (무한 새로고침 방지)', () => {
    expect(indexHtml).toContain('MAX_ATTEMPTS = 3');
    expect(indexHtml).toMatch(/attempts\s*>=\s*MAX_ATTEMPTS/);
  });

  it('3회 초과 시 재시도를 멈추고 안내 문구 + 다시 시도 버튼으로 교체한다', () => {
    expect(indexHtml).toContain('페이지를 불러오지 못했어요');
    expect(indexHtml).toContain('다시 시도');
    expect(indexHtml).toContain('showRetryFallback');
  });

  it('RootErrorBoundary가 쓰는 chunk-reload-attempted 키와 겹치지 않는 별도 키를 쓴다', () => {
    expect(indexHtml).toContain("var COUNTER_KEY = 'entry-asset-reload-attempts';");
    expect(indexHtml).not.toContain("= 'chunk-reload-attempted'");
  });

  it('main.tsx가 진입 시 부트 가드 재시도 카운터를 지운다', () => {
    expect(mainTsx).toContain("sessionStorage.removeItem('entry-asset-reload-attempts')");
  });
});
