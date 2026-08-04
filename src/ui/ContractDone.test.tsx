// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PAGES, resolvePage } from './resolvePage';
import { ContractDone } from './ContractDone';

beforeEach(() => {
  document.head.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
});

describe('resolvePage', () => {
  it('/contract/done을 완료 페이지로 해석한다', () => {
    expect(resolvePage('/contract/done')).toBe(PAGES['/contract/done']);
  });
});

describe('ContractDone', () => {
  it('제목·다음 단계·두 링크를 렌더한다', () => {
    render(<ContractDone />);

    expect(screen.getByRole('heading', { level: 1, name: '서류가 만들어졌어요' })).toBeTruthy();

    expect(screen.getByText('가족관계증명서(상세) 발급')).toBeTruthy();
    expect(screen.getByText('홈택스에서 증여세 신고')).toBeTruthy();

    const guideLink = screen.getByRole('link', { name: /유기정기금 증여 신고 가이드/ });
    expect(guideLink.getAttribute('href')).toBe('/guide/annuity-gift-report');

    const retryLink = screen.getByRole('link', { name: '계약서 다시 만들기' });
    expect(retryLink.getAttribute('href')).toBe('/');
  });

  it('검색 노출을 막는 noindex 메타를 삽입하고 페이지 메타를 설정한다', () => {
    render(<ContractDone />);

    expect(document.title).toBe('서류가 만들어졌어요 | 이코치맘');
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')!.content).toBe('noindex');
  });
});
