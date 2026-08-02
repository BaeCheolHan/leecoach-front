import type { ReactNode } from 'react';
import { SiteHeader } from '../SiteHeader';
import { SiteFooter } from '../SiteFooter';

/** 가이드 섹션 공통 프레임 — 공통 헤더 + 본문 + 하단 링크 */
export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <main className="container guide">
      <SiteHeader />
      {children}
      <SiteFooter />
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
