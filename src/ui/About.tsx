import { DISCLAIMER } from '../config';
import { INSTAGRAM_URL, SiteHeader } from './SiteHeader';
import { ManualPromo } from './guide/ManualPromo';
import { usePageMeta } from './usePageMeta';

export function About() {
  usePageMeta({
    title: '이코치맘을 소개합니다 | 이코치맘',
    description: '간호사 엄마 이코치맘이 만든 증여 도구와 가이드 — 사이트 소개와 만든 이유',
    path: '/about',
  });

  return (
    <main className="container about">
      <SiteHeader />
      <h1>이코치맘을 소개합니다</h1>

      <section className="card">
        <h2>간호사이자 두 아이의 엄마입니다</h2>
        <p>
          5살 딸과 갓 태어난 아들을 키우고 있습니다. 인스타그램(@leecoach_mom)에서 자녀 증여 시리즈를
          연재하며 받은 질문들에서 이 사이트가 시작됐습니다.
        </p>
        <p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            인스타그램
          </a>
        </p>
      </section>

      <section className="card">
        <h2>이 사이트에서 할 수 있는 일</h2>
        <ol>
          <li>
            유기정기금 증여계약서·평가명세서를 무료로 만들 수 있습니다. 입력 정보는 브라우저에서만 처리되며
            서버로 전송되지 않습니다.
          </li>
          <li>증여 가이드를 무료로 연재합니다.</li>
        </ol>
        <p>
          <a href="/">계약서 만들기</a> · <a href="/guide">가이드</a>
        </p>
      </section>

      <p>유료 매뉴얼은 현직 세무사의 자문을 받아 제작했으며 크티에서 판매합니다.</p>
      <ManualPromo variant="inline" />
      <p className="disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
