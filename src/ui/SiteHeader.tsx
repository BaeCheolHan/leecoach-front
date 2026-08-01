/** 전 페이지 공통 헤더 — 브랜드 + 현재 페이지가 아닌 쪽으로 가는 CTA */
export function SiteHeader() {
  const onTool = window.location.pathname === '/';
  return (
    <nav className="top-nav">
      <a className="top-nav-brand" href="/guide">
        이코치맘
      </a>
      {onTool ? (
        <a className="top-nav-cta" href="/guide">
          증여 가이드
        </a>
      ) : (
        <a className="top-nav-cta" href="/">
          계약서 만들기
        </a>
      )}
    </nav>
  );
}
