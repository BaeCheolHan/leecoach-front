import type { ReactNode } from 'react';
import { INSTAGRAM_URL, SiteHeader } from '../SiteHeader';

/** 가이드 섹션 공통 프레임 — 공통 헤더 + 본문 + 하단 링크 */
export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <main className="container guide">
      <SiteHeader />
      {children}
      <p className="footer-links">
        <a href="/guide">가이드 목록</a> · <a href="/">계약서 만들기</a> ·{' '}
        <a href="/simulator">자산 시뮬레이터</a> · <a href="/about">소개</a> ·{' '}
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          인스타그램
        </a>{' '}
        · <a href="/privacy">개인정보처리방침</a>
      </p>
    </main>
  );
}

/** 도구로 유도하는 CTA 버튼 — 라벨은 한 종류로 통일 (같은 목적지의 버튼이 다르게 보이지 않도록) */
export function ToolCta({ label = '무료로 계산하고 서류 만들기' }: { label?: string }) {
  return (
    <p className="guide-cta">
      <a className="btn-primary" href="/">
        {label}
      </a>
    </p>
  );
}
