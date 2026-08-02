// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { PAGES, resolvePage } from '../resolvePage';
import { About } from '../About';
import { GuideIndex } from './GuideIndex';
import { AnnuityGiftReport } from './AnnuityGiftReport';
import { GiftDeductionLimits } from './GiftDeductionLimits';
import { MinorStockAccount } from './MinorStockAccount';
import { LoanVsGift } from './LoanVsGift';
import { NoReportRisks } from './NoReportRisks';
import { TaxFreeMoney } from './TaxFreeMoney';
import { ChildBenefitAccount } from './ChildBenefitAccount';
import { GrandparentGift } from './GrandparentGift';
import { SpouseGift } from './SpouseGift';
import { GiftRoadmap } from './GiftRoadmap';
import { MarriageBirthDeduction } from './MarriageBirthDeduction';
import { RelatedGuides } from './RelatedGuides';

beforeEach(() => {
  localStorage.clear();
  document.head.querySelectorAll('meta[name="description"], link[rel="canonical"], #faq-jsonld').forEach((el) => el.remove());
});

describe('resolvePage', () => {
  it('경로별로 올바른 페이지를 반환한다', () => {
    expect(resolvePage('/')).toBe(PAGES['/']);
    expect(resolvePage('/privacy')).toBe(PAGES['/privacy']);
    expect(resolvePage('/about')).toBe(PAGES['/about']);
    expect(resolvePage('/guide')).toBe(PAGES['/guide']);
    expect(resolvePage('/guide/')).toBe(PAGES['/guide']); // 트레일링 슬래시 허용
    expect(resolvePage('/guide/annuity-gift-report')).toBe(PAGES['/guide/annuity-gift-report']);
  });
  it('알 수 없는 경로는 404 페이지를 반환한다', () => {
    expect(resolvePage('/unknown')).toBe(PAGES['404']);
  });
  it('증여재산공제 한도 가이드 경로를 반환한다', () => {
    expect(resolvePage('/guide/gift-deduction-limits')).toBe(PAGES['/guide/gift-deduction-limits']);
  });
});

describe('About', () => {
  it('소개 내용·링크·페이지 메타를 렌더한다', () => {
    render(<About />);
    expect(screen.getByRole('heading', { level: 1, name: '이코치맘을 소개합니다' })).toBeTruthy();
    expect(screen.getByText(/간호사이자 두 아이/)).toBeTruthy();
    expect(screen.getByText('세무사가 검토한 우리 아이 증여 실무 매뉴얼')).toBeTruthy();
    expect(screen.getByText(/세무 자문이 아닙니다/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /팔로우하기/ }).getAttribute('href')).toContain('leecoach_mom');
    expect(screen.getByRole('link', { name: '계약서 만들기' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: '가이드 보기' }).getAttribute('href')).toBe('/guide');
    expect(document.title).toBe('이코치맘을 소개합니다 | 이코치맘');
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
    const link = screen.getByRole('link', { name: '자세히 보기 →' });
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
    expect(resolvePage('/guide/minor-stock-account')).toBe(PAGES['/guide/minor-stock-account']);
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
    expect(resolvePage('/guide/loan-vs-gift')).toBe(PAGES['/guide/loan-vs-gift']);
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
    expect(resolvePage('/guide/no-report-risks')).toBe(PAGES['/guide/no-report-risks']);
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

describe('TaxFreeMoney', () => {
  it('비과세 경계 가이드 경로와 본문을 렌더한다', () => {
    expect(resolvePage('/guide/tax-free-money')).toBe(PAGES['/guide/tax-free-money']);
    const { container } = render(<TaxFreeMoney />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '세뱃돈과 용돈은 증여인가요? — 비과세의 경계',
      }),
    ).toBeTruthy();
    expect(screen.getByText('세뱃돈은 얼마까지 괜찮나요?')).toBeTruthy();
    expect(container.querySelectorAll('.guide-cta')).toHaveLength(1);
  });

  it('FAQ JSON-LD 5개를 삽입한다', () => {
    render(<TaxFreeMoney />);
    const script = document.getElementById('faq-jsonld-taxfree');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(5);
  });
});

describe('ChildBenefitAccount', () => {
  it('아동수당 계좌 가이드 경로와 본문을 렌더한다', () => {
    expect(resolvePage('/guide/child-benefit-account')).toBe(PAGES['/guide/child-benefit-account']);
    const { container } = render(<ChildBenefitAccount />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '아동수당도 증여세 신고해야 하나요? — 아이 계좌로 받는 3단계 방어 전략',
      }),
    ).toBeTruthy();
    expect(screen.getByText('아동수당을 모아서 아이 주식계좌에서 투자해도 되나요?')).toBeTruthy();
    expect(container.querySelectorAll('.step-list')).toHaveLength(1);
    expect(container.querySelectorAll('.guide-cta')).toHaveLength(0);
    expect(container.querySelector('.manual-promo-inline')).toBeTruthy();
    expect(document.title).toBe('아동수당도 증여세 신고해야 하나요? — 아이 계좌로 받는 3단계 방어 전략 | 이코치맘');
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="description"]')!.content).toBe(
      '아동수당은 증여세 신고 대상일까? 비과세 원리와 부모 이체로 생기는 오해, 아이 명의 계좌·자금 분리·장기 보유의 3단계 관리 전략을 정리했습니다.',
    );
  });

  it('FAQ JSON-LD 3개를 삽입한다', () => {
    render(<ChildBenefitAccount />);
    const script = document.getElementById('faq-jsonld-child-benefit');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(3);
  });
});

describe.each([
  {
    name: 'MarriageBirthDeduction',
    path: '/guide/marriage-birth-deduction',
    component: MarriageBirthDeduction,
    title: '결혼하면 1억을 더 받을 수 있다? — 혼인·출산 증여공제',
    faq: '결혼 전에 미리 받아도 되나요?',
    jsonLdId: 'faq-jsonld-marriage',
    ctaCount: 0,
  },
  {
    name: 'GrandparentGift',
    path: '/guide/grandparent-gift',
    component: GrandparentGift,
    title: '할머니가 손주에게 주는 돈, 세금이 더 붙나요? — 세대생략 할증',
    faq: '외할머니도 합산되나요?',
    jsonLdId: 'faq-jsonld-grand',
    ctaCount: 1,
  },
  {
    name: 'SpouseGift',
    path: '/guide/spouse-gift',
    component: SpouseGift,
    title: '부부 사이에도 증여세가 있나요? — 배우자 공제 6억의 활용',
    faq: '생활비로 매달 300 보내는데 신고하나요?',
    jsonLdId: 'faq-jsonld-spouse',
    ctaCount: 0,
  },
  {
    name: 'GiftRoadmap',
    path: '/guide/gift-roadmap',
    component: GiftRoadmap,
    title: '0세부터 30세까지, 세금 없이 1억 4천 물려주는 로드맵',
    faq: '꼭 10년을 채워야 하나요?',
    jsonLdId: 'faq-jsonld-roadmap',
    ctaCount: 1,
  },
])('$name', ({ path, component, title, faq, jsonLdId, ctaCount }) => {
  it('가이드 경로와 본문을 렌더한다', () => {
    expect(resolvePage(path)).toBe(PAGES[path]);
    const { container } = render(createElement(component));
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByText(faq)).toBeTruthy();
    expect(container.querySelectorAll('.guide-cta')).toHaveLength(ctaCount);
  });

  it('FAQ JSON-LD 5개를 삽입한다', () => {
    render(createElement(component));
    const script = document.getElementById(jsonLdId);
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(5);
  });
});

describe('RelatedGuides', () => {
  it('현재 글을 제외한 다음 글 2개를 렌더한다', () => {
    const { container } = render(<RelatedGuides current="/guide/gift-roadmap" />);
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('.related-guides a'));

    expect(links).toHaveLength(2);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/guide/marriage-birth-deduction',
      '/guide/tax-free-money',
    ]);
    expect(container.querySelector('a[href="/guide/gift-roadmap"]')).toBeNull();
  });

  it('GiftRoadmap 하단에 관련 글 추천을 렌더한다', () => {
    render(<GiftRoadmap />);
    expect(screen.getByRole('heading', { level: 2, name: '다음에 읽어보세요' })).toBeTruthy();
  });
});
