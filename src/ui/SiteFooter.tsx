import { INSTAGRAM_URL } from './SiteHeader';

/**
 * 전 페이지 공통 하단 링크. 페이지마다 따로 쓰다 보니 항목이 서로 달랐고
 * 소개·개인정보·404에는 아예 없었다. 어디서나 같은 항목을 같은 순서로 보여준다.
 *
 * 자산 시뮬레이터(/simulator)는 아직 운영에 없으므로 넣지 않는다. 배포될 때 함께 추가한다.
 */
export function SiteFooter() {
  return (
    <p className="footer-links">
      <a href="/guide">증여 가이드</a> · <a href="/">계약서 만들기</a> ·{' '}
      <a href="/about">소개</a> ·{' '}
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
        인스타그램
      </a>{' '}
      · <a href="/privacy">개인정보처리방침</a>
    </p>
  );
}
