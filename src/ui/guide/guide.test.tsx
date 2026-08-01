// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { resolvePage } from '../resolvePage';
import App from '../App';
import { Privacy } from '../Privacy';
import { GuideIndex } from './GuideIndex';
import { AnnuityGiftReport } from './AnnuityGiftReport';

beforeEach(() => {
  localStorage.clear();
  document.head.querySelectorAll('meta[name="description"], link[rel="canonical"], #faq-jsonld').forEach((el) => el.remove());
});

describe('resolvePage', () => {
  it('경로별로 올바른 페이지를 반환한다', () => {
    expect(resolvePage('/')).toBe(App);
    expect(resolvePage('/privacy')).toBe(Privacy);
    expect(resolvePage('/guide')).toBe(GuideIndex);
    expect(resolvePage('/guide/')).toBe(GuideIndex); // 트레일링 슬래시 허용
    expect(resolvePage('/guide/annuity-gift-report')).toBe(AnnuityGiftReport);
  });
  it('알 수 없는 경로는 메인 앱으로 폴백한다', () => {
    expect(resolvePage('/unknown')).toBe(App);
  });
});

describe('GuideIndex', () => {
  it('글 목록과 페이지 메타를 렌더한다', () => {
    render(<GuideIndex />);
    expect(screen.getByRole('heading', { level: 1, name: '증여 가이드' })).toBeTruthy();
    expect(screen.getByText(/유기정기금 증여 신고 가이드/)).toBeTruthy();
    expect(document.title).toContain('증여 가이드');
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).toBe(
      'https://leecoachmom.com/guide',
    );
  });
});

describe('AnnuityGiftReport', () => {
  it('본문 섹션·CTA·FAQ를 렌더한다', () => {
    render(<AnnuityGiftReport />);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByText(/홈택스 신고/)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /만들기|계산해 보기/ }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('매달 이체할 때마다 신고해야 하나요?')).toBeTruthy();
  });
  it('FAQ JSON-LD를 삽입한다', () => {
    render(<AnnuityGiftReport />);
    const script = document.getElementById('faq-jsonld');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity.length).toBe(6);
  });
});
