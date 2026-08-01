export const INSTAGRAM_URL = 'https://www.instagram.com/leecoach_mom/';

/** 전 페이지 공통 헤더 — 브랜드(→가이드 목록) + 인스타그램. 도구 페이지에서만 가이드 CTA 표시 */
export function SiteHeader() {
  const onTool = window.location.pathname === '/';
  return (
    <nav className="top-nav">
      <a className="top-nav-brand" href="/guide">
        이코치맘
      </a>
      <div className="top-nav-right">
        <a
          className="top-nav-insta"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="이코치맘 인스타그램"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" strokeWidth="2" strokeLinecap="round">
            <defs>
              <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#feda75" />
                <stop offset="30%" stopColor="#fa7e1e" />
                <stop offset="60%" stopColor="#d62976" />
                <stop offset="100%" stopColor="#962fbf" />
              </linearGradient>
            </defs>
            <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#ig-grad)" />
            <circle cx="12" cy="12" r="4.3" stroke="url(#ig-grad)" />
            <circle cx="17.4" cy="6.6" r="1.2" fill="url(#ig-grad)" stroke="none" />
          </svg>
        </a>
        {onTool && (
          <a className="top-nav-cta" href="/guide">
            증여 가이드
          </a>
        )}
      </div>
    </nav>
  );
}
