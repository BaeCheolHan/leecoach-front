import { useEffect } from 'react';
import { GuideLayout, ToolCta } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';
import { usePageMeta } from '../usePageMeta';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';

/** FAQ — 화면 렌더와 JSON-LD(FAQPage)의 단일 소스 */
const FAQ: { q: string; a: string }[] = [
  {
    q: '매달 이체할 때마다 신고해야 하나요?',
    a: '아니요. 유기정기금 증여는 계약으로 정한 전체 기간의 증여를 시작 시점에 한 번에 평가해서 신고합니다. 증여시작일 기준으로 1회만 신고하면 되고, 이후 매달 이체는 신고 없이 계약대로 실행하면 됩니다.',
  },
  {
    q: '세금이 0원인데도 신고해야 하나요?',
    a: '법적 의무는 아니지만 신고를 강력히 권합니다. 신고해 두면 자녀 계좌의 자금 출처가 국세청에 공식 기록으로 남아, 나중에 자녀가 그 돈으로 주식·부동산을 살 때 자금출처 소명이 간단해집니다.',
  },
  {
    q: '돈은 어떤 계좌로 보내야 하나요?',
    a: '반드시 자녀(수증자) 명의 계좌로 보내야 합니다. 부모 명의 계좌에 모아두면 증여로 인정받기 어렵습니다. 이체 내역이 곧 증빙이 되므로 계약서에 적은 지급일·금액과 일치하게 보내는 것이 좋습니다.',
  },
  {
    q: '10년 안에 다른 증여가 또 있으면 어떻게 되나요?',
    a: '같은 사람(예: 아빠)에게 받은 증여는 10년간 합산해서 공제 한도를 적용합니다. 이전에 준 돈이 있다면 그 금액을 빼고 한도를 계산해야 하니, 기증여가 있다면 세무사 상담을 권합니다.',
  },
  {
    q: '미성년 자녀는 누가 신고하나요?',
    a: '신고 명의자는 수증자인 자녀이고, 미성년자는 법정대리인(부모)이 대신 신고합니다. 홈택스에서 자녀 명의로 로그인하거나, 부모가 대리인 자격으로 신고할 수 있습니다.',
  },
  {
    q: '중간에 매달 보내는 금액을 바꾸고 싶으면요?',
    a: '이미 신고한 계약 내용과 달라지면 세무상 별도 판단이 필요합니다. 금액을 늘리면 추가 증여로 신고해야 할 수 있으니, 변경 전에 세무사와 상의하는 것이 안전합니다.',
  },
];

const META = {
  title: '자녀에게 매달 증여하고 세금 0원 만들기 — 유기정기금 증여 신고 가이드 | 이코치맘',
  description:
    '유기정기금 증여란? 매달 자녀에게 이체하면서 증여세를 줄이는 원리(연 3% 할인평가), 증여계약서·평가명세서 준비, 홈택스 신고 방법까지 전체 흐름을 쉽게 정리했습니다.',
  path: '/guide/annuity-gift-report',
};

export function AnnuityGiftReport() {
  usePageMeta(META);

  // FAQ 구조화 데이터 — 구글 검색 결과에 Q&A로 노출될 수 있게
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
      url: `${SITE_ORIGIN}${META.path}`,
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <GuideLayout>
      <article>
        <h1>자녀에게 매달 증여하고 세금 0원 만들기</h1>
        <p className="guide-lede">유기정기금 증여 신고, 처음부터 끝까지 한 번에 정리했습니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>
              매달 자녀에게 보내는 증여, 계약서를 쓰면 <b>신고는 딱 한 번</b>이면 됩니다.
            </li>
            <li>
              미래에 줄 돈은 <b>연 3% 할인해서 평가</b> — 같은 돈도 세금이 줄어듭니다.
            </li>
            <li>
              필요한 서류는 <b>계약서·평가명세서 2장</b>, 이 사이트에서 무료로 만듭니다.
            </li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 유기정기금 증여가 뭔가요?</h2>
          <p>
            <b>"10년간 매달 50만 원씩 줄게"</b>라고 계약하고 나눠서 주는 증여입니다.
          </p>
          <ul>
            <li>목돈을 한 번에 주는 대신, 기간을 정해 매달 지급합니다.</li>
            <li>
              시작할 때 <b>한 번만 신고</b>하면, 이후 매달 이체는 신고가 필요 없습니다.
            </li>
          </ul>
        </section>

        <section className="card guide-section">
          <h2>2. 왜 세금이 줄어드나요?</h2>
          <p>
            미래에 받을 돈은 <b>연 3%씩 할인해서 현재 가치로 평가</b>하기 때문입니다(상증세법 시행령 제62조).
          </p>
          <div className="stat-card">
            <p className="stat-title">예시: 미성년 자녀에게 매달 19만 원 × 10년</p>
            <div className="stat-row">
              <div className="stat">
                <span>실제 주는 돈</span>
                <b>2,280만원</b>
              </div>
              <div className="stat">
                <span>세법상 평가액</span>
                <b>1,969만원</b>
              </div>
              <div className="stat stat-accent">
                <span>증여세</span>
                <b>0원</b>
              </div>
            </div>
            <p className="stat-foot">미성년 공제 한도 2,000만 원(10년) 이내 — 한 번에 주면 한도를 넘지만, 나눠 주면 0원.</p>
          </div>
        </section>

        <section className="card guide-section">
          <h2>3. 준비물은 딱 2장</h2>
          <ul className="doc-list">
            <li>
              <b>증여계약서</b>
              <span>기간·금액·지급일을 적고 부모·자녀가 날인. 증여 시작 전에 작성.</span>
            </li>
            <li>
              <b>유기정기금 평가명세서</b>
              <span>연도별 3% 할인 평가 계산 내역. 신고할 때 근거로 첨부.</span>
            </li>
          </ul>
          <p>이름·금액·기간만 입력하면 두 서류가 PDF로 완성됩니다. 정보는 서버로 전송되지 않아요.</p>
          <ToolCta />
        </section>

        <section className="card guide-section">
          <h2>4. 홈택스 신고 6단계</h2>
          <p className="guide-note">
            <b>신고 기한</b>: 증여 시작일이 속한 달의 말일부터 <b>3개월 이내</b> (8월 시작 → 11월 30일까지)
          </p>
          <ol className="step-list">
            <li>
              <b>홈택스 로그인</b>
              <span>자녀(수증자) 명의로. 미성년은 부모가 대리 신고.</span>
            </li>
            <li>
              <b>증여세 → 일반증여(정기신고)</b>
              <span>메뉴 이름이 다르면 "증여세 신고"로 검색.</span>
            </li>
            <li>
              <b>증여자·수증자 정보 입력</b>
              <span>계약서에 적은 내용과 동일하게.</span>
            </li>
            <li>
              <b>재산가액 입력</b>
              <span>평가명세서의 할인평가액 합계 금액.</span>
            </li>
            <li>
              <b>공제 적용 확인</b>
              <span>한도 이내면 납부세액 0원으로 표시됩니다.</span>
            </li>
            <li>
              <b>서류 첨부·제출</b>
              <span>계약서, 평가명세서, 가족관계증명서, 이체 내역.</span>
            </li>
          </ol>
          <p className="guide-note">
            기증여 합산 등 변수가 있으면 세무사 대행(보통 수십만 원)도 방법입니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>5. 자주 묻는 질문</h2>
          {FAQ.map((f) => (
            <details key={f.q} className="guide-faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <ToolCta />
        <ManualPromo variant="inline" />
        <RelatedGuides current={META.path} />
        <p className="disclaimer">{DISCLAIMER}</p>
      </article>
    </GuideLayout>
  );
}
