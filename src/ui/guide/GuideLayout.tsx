import type { ReactNode } from 'react';
import { SiteHeader } from '../SiteHeader';

/** 가이드 섹션 공통 프레임 — 공통 헤더 + 본문 + 하단 링크 */
export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <main className="container guide">
      <SiteHeader />
      {children}
      <p className="footer-links">
        <a href="/guide">가이드 목록</a> · <a href="/">계약서 만들기</a> ·{' '}
        <a href="/privacy">개인정보처리방침</a>
      </p>
    </main>
  );
}

/** 도구로 유도하는 CTA 버튼 */
export function ToolCta({ label = '증여계약서 1분 만에 무료로 만들기' }: { label?: string }) {
  return (
    <p className="guide-cta">
      <a className="btn-primary" href="/">
        {label}
      </a>
    </p>
  );
}
