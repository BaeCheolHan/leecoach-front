/** 전 페이지 공통 헤더 — 브랜드(→가이드 목록). 도구 페이지에서만 가이드 CTA 표시 */
export function SiteHeader() {
  const onTool = window.location.pathname === '/';
  return (
    <nav className="top-nav">
      <a className="top-nav-brand" href="/guide">
        이코치맘
      </a>
      {onTool && (
        <a className="top-nav-cta" href="/guide">
          증여 가이드
        </a>
      )}
    </nav>
  );
}
