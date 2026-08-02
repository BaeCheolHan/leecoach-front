// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteFooter } from './SiteFooter';

const EXPECTED_LINKS = [
  ['증여 가이드', '/guide'],
  ['계약서 만들기', '/'],
  ['소개', '/about'],
  ['개인정보처리방침', '/privacy'],
] as const;

describe('SiteFooter', () => {
  it.each(EXPECTED_LINKS)('%s 링크를 %s 로 연결한다', (label, href) => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: label }).getAttribute('href')).toBe(href);
  });

  it('인스타그램은 새 탭으로 안전하게 연다', () => {
    render(<SiteFooter />);
    const insta = screen.getByRole('link', { name: '인스타그램' });

    expect(insta.getAttribute('target')).toBe('_blank');
    expect(insta.getAttribute('rel')).toContain('noopener');
  });

  it('아직 배포되지 않은 시뮬레이터로는 링크하지 않는다', () => {
    const { container } = render(<SiteFooter />);
    // 운영에 /simulator 라우트가 없어 링크를 걸면 404가 된다. 배포될 때 함께 추가한다.
    expect(container.querySelector('a[href="/simulator"]')).toBeNull();
  });
});
