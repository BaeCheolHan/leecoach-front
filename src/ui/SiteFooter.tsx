import { INSTAGRAM_URL } from './SiteHeader';

/**
 * 전 페이지 공통 하단 링크. 페이지마다 따로 쓰다 보니 계약서 도구에는 시뮬레이터가 빠지고
 * 소개·개인정보·404·시뮬레이터에는 아예 없는 상태였다. 어디서나 같은 항목을 같은 순서로 보여준다.
 */
export function SiteFooter() {
  return (
    <p className="footer-links">
      <a href="/guide">증여 가이드</a> · <a href="/">계약서 만들기</a> ·{' '}
      <a href="/simulator">자산 시뮬레이터</a> · <a href="/about">소개</a> ·{' '}
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
        인스타그램
      </a>{' '}
      · <a href="/privacy">개인정보처리방침</a>
    </p>
  );
}
