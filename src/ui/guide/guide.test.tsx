// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { resolvePage } from '../resolvePage';
import App from '../App';
import { Privacy } from '../Privacy';
import { NotFound } from '../NotFound';
import { GuideIndex } from './GuideIndex';
import { AnnuityGiftReport } from './AnnuityGiftReport';
import { GiftDeductionLimits } from './GiftDeductionLimits';
import { MinorStockAccount } from './MinorStockAccount';
import { LoanVsGift } from './LoanVsGift';
import { NoReportRisks } from './NoReportRisks';

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
  it('알 수 없는 경로는 404 페이지를 반환한다', () => {
    expect(resolvePage('/unknown')).toBe(NotFound);
  });
  it('증여재산공제 한도 가이드 경로를 반환한다', () => {
    expect(resolvePage('/guide/gift-deduction-limits')).toBe(GiftDeductionLimits);
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

  it('유료 매뉴얼 카드와 크티 외부 링크를 렌더한다', () => {
    render(<GuideIndex />);
    expect(screen.getByText('세무사가 검토한 우리 아이 증여 실무 매뉴얼')).toBeTruthy();
    const link = screen.getByRole('link', { name: '크티에서 자세히 보기 →' });
    expect(link.getAttribute('href')).toContain('ctee.kr/item/store/91932');
    expect(link.getAttribute('target')).toBe('_blank');
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

describe('GiftDeductionLimits', () => {
  it('제목·FAQ·CTA를 렌더한다', () => {
    const { container } = render(<GiftDeductionLimits />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '세금 없이 줄 수 있는 금액은? 증여재산공제 한도 총정리',
      }),
    ).toBeTruthy();
    expect(screen.getByText('아빠와 엄마가 각각 5천만씩 줄 수 있나요?')).toBeTruthy();
    expect(container.querySelectorAll('.guide-cta')).toHaveLength(1); // CTA는 글 끝 1개만 (섹션 중복 제거)
  });

  it('FAQ JSON-LD 5개를 삽입한다', () => {
    render(<GiftDeductionLimits />);
    const script = document.getElementById('faq-jsonld-deduction');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(5);
  });
});

describe('MinorStockAccount', () => {
  it('미성년 자녀 주식계좌 가이드 경로를 반환한다', () => {
    expect(resolvePage('/guide/minor-stock-account')).toBe(MinorStockAccount);
  });

  it('제목·FAQ·CTA를 렌더한다', () => {
    const { container } = render(<MinorStockAccount />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '미성년 자녀 주식계좌 만들기 — 서류부터 증여 신고까지',
      }),
    ).toBeTruthy();
    expect(screen.getByText('어떤 증권사가 좋나요?')).toBeTruthy();
    expect(container.querySelectorAll('.guide-cta')).toHaveLength(1);
  });

  it('FAQ JSON-LD 5개를 삽입한다', () => {
    render(<MinorStockAccount />);
    const script = document.getElementById('faq-jsonld-stock');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(5);
  });

  it('글 하단에 유료 매뉴얼 인라인 프로모션을 렌더한다', () => {
    const { container } = render(<MinorStockAccount />);
    expect(container.querySelector('.manual-promo-inline')).toBeTruthy();
    expect(screen.getByText('세무사가 검토한 우리 아이 증여 실무 매뉴얼')).toBeTruthy();
  });
});

describe('LoanVsGift', () => {
  it('차용증 vs 증여계약서 가이드 경로를 반환한다', () => {
    expect(resolvePage('/guide/loan-vs-gift')).toBe(LoanVsGift);
  });

  it('제목·FAQ·CTA를 렌더한다', () => {
    const { container } = render(<LoanVsGift />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '부모 자식 간 돈 거래, 빌린 걸까 증여일까 — 차용증 vs 증여계약서',
      }),
    ).toBeTruthy();
    expect(screen.getByText('차용증을 나중에 쓰면 안 되나요?')).toBeTruthy();
    expect(container.querySelectorAll('.guide-cta')).toHaveLength(0); // 도구 CTA 없음 — 글 성격상 제거 (사용자 결정)
  });

  it('FAQ JSON-LD 5개를 삽입한다', () => {
    render(<LoanVsGift />);
    const script = document.getElementById('faq-jsonld-loan');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(5);
  });
});

describe('NoReportRisks', () => {
  it('증여세 무신고 위험 가이드 경로를 반환한다', () => {
    expect(resolvePage('/guide/no-report-risks')).toBe(NoReportRisks);
  });

  it('제목·FAQ·CTA를 렌더한다', () => {
    const { container } = render(<NoReportRisks />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '증여세 신고 안 하면 어떻게 되나요? — 가산세와 자금출처조사',
      }),
    ).toBeTruthy();
    expect(screen.getByText('몇 년 지나면 그냥 넘어가나요?')).toBeTruthy();
    expect(container.querySelectorAll('.guide-cta')).toHaveLength(1);
  });

  it('FAQ JSON-LD 5개를 삽입한다', () => {
    render(<NoReportRisks />);
    const script = document.getElementById('faq-jsonld-noreport');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(5);
  });
});
