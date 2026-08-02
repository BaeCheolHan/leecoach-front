import { SiteHeader } from './SiteHeader';
import { usePageMeta } from './usePageMeta';
import { SiteFooter } from './SiteFooter';

export function NotFound() {
  usePageMeta({
    title: '페이지를 찾을 수 없습니다 | 이코치맘',
    description: '요청하신 페이지가 없습니다.',
    path: window.location.pathname,
  });
  return (
    <main className="container">
      <SiteHeader />
      <section className="card notfound">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>주소가 바뀌었거나 잘못 입력된 것 같아요. 아래에서 원하시는 곳으로 이동해 주세요.</p>
        <p className="notfound-links">
          <a className="btn-primary" href="/">
            증여계약서 만들기
          </a>
          <a className="btn-secondary" href="/guide">
            증여 가이드 보기
          </a>
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
