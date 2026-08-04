import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { usePageMeta } from './usePageMeta';
import { ToolCta } from './guide/GuideLayout';
import { ManualPromo } from './guide/ManualPromo';
import { DISCLAIMER } from '../config';

/**
 * 저장 완료 후 실제 페이지 이동(window.location.assign)으로 도달하는 완료 화면.
 * Cloudflare Web Analytics는 실제 문서 로드만 페이지뷰로 집계하고 history.pushState는
 * 비콘을 발생시키지 않는다 — 그래서 `/` 페이지뷰 대비 이 페이지뷰 수로 "도구 진입 대비
 * 서류 완료율"을 측정한다 (Step3Result 참조). 검색 노출 대상이 아니므로 noindex를 전달하고
 * sitemap.xml·SiteFooter 링크 목록에는 넣지 않는다.
 */
export function ContractDone() {
  usePageMeta({
    title: '서류가 만들어졌어요 | 이코치맘',
    description:
      '증여계약서와 유기정기금 평가명세서 PDF 저장을 완료했습니다. 다음 단계인 가족관계증명서 발급과 홈택스 증여세 신고를 안내합니다.',
    path: '/contract/done',
    noindex: true,
  });

  return (
    <main className="container">
      <SiteHeader />
      <h1>서류가 만들어졌어요</h1>
      <p className="guide-lede">
        증여계약서와 유기정기금 평가명세서를 저장했어요. 저장이 안 됐다면 다시 만들어 보세요.
      </p>

      <section className="card guide-section">
        <h2>다음 단계</h2>
        <ol className="step-list">
          <li>
            <b>가족관계증명서(상세) 발급</b>
            <span>아이 기준으로 정부24나 무인발급기에서 받으세요. 이 서류는 직접 발급받아야 해요.</span>
          </li>
          <li>
            <b>홈택스에서 증여세 신고</b>
            <span>증여일이 속한 달의 말일부터 3개월 안에 신고해요.</span>
          </li>
        </ol>
      </section>

      <a className="next-guide" href="/guide/annuity-gift-report">
        <b>유기정기금 증여 신고 가이드</b>
        <span>서류 첨부부터 제출까지, 신고 방법 보기 →</span>
      </a>
      <ToolCta label="계약서 다시 만들기" />

      <ManualPromo variant="inline" />
      <p className="disclaimer">{DISCLAIMER}</p>
      <SiteFooter />
    </main>
  );
}
