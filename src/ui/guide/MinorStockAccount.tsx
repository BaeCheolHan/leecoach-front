import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout, ToolCta } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';

/** FAQ — 화면 렌더와 JSON-LD(FAQPage)의 단일 소스 */
const FAQ: { q: string; a: string }[] = [
  {
    q: '어떤 증권사가 좋나요?',
    a: '대부분의 증권사에서 가능합니다. 비대면 개설 지원 여부와 요구 서류를 앱에서 비교해 보세요.',
  },
  {
    q: '아이 명의 계좌인데 매매는 누가 하나요?',
    a: '법정대리인인 부모가 할 수 있습니다.',
  },
  {
    q: '주식이 올라 2,000만 원이 넘으면 세금 내나요?',
    a: '신고된 원금의 운용 수익은 원칙적으로 추가 증여가 아닙니다. 다만 계좌 운용 방식에 따라 달리 판단된 사례가 있어, 경계가 되는 경우는 세무사 확인을 권합니다.',
  },
  {
    q: '해외 주식도 살 수 있나요?',
    a: '가능합니다. 증권사별로 미성년 해외주식 거래 지원 여부가 다르니 확인하세요.',
  },
  {
    q: '신고 전에 주식부터 사도 되나요?',
    a: '순서상 증여 신고를 먼저 하는 것이 자금 출처를 깔끔하게 남기는 방법입니다.',
  },
];

const META = {
  title: '미성년 자녀 주식계좌 만들기 — 서류부터 증여 신고까지 | 이코치맘',
  description:
    '미성년 자녀 주식계좌 개설에 필요한 서류, 비대면 개설 방법, 증여 후 신고와 주식 매수 순서까지 한 번에 정리했습니다.',
  path: '/guide/minor-stock-account',
};

export function MinorStockAccount() {
  usePageMeta(META);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-stock';
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
        <h1>미성년 자녀 주식계좌 만들기 — 서류부터 증여 신고까지</h1>
        <p className="guide-lede">계좌 개설 서류부터 증여 신고와 주식 매수 순서까지 쉽게 정리했습니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>
              자녀 주식계좌는 <b>부모(법정대리인)가 대신 개설</b> — 요즘은 대부분 비대면으로 가능합니다.
            </li>
            <li>
              순서가 중요합니다. <b>계좌 개설 → 증여(이체) → 증여세 신고 → 주식 매수</b> 순서로 진행하세요.
            </li>
            <li>
              <b>신고해 둔 원금으로 산 주식의 수익</b>은 추가 증여세가 없습니다.
            </li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 준비 서류 3가지</h2>
          <ol className="step-list">
            <li>
              <b>부모 신분증</b>
            </li>
            <li>
              <b>가족관계증명서(상세)</b> — 부모 기준으로, 주민등록번호 뒷자리를 포함해 발급합니다.
            </li>
            <li>
              <b>자녀 기본증명서(상세)</b>
            </li>
          </ol>
          <p>
            서류는 통상 3개월 이내 발급본이어야 합니다. 정부24 또는 대법원 전자가족관계등록시스템에서 무료로
            발급할 수 있습니다.
          </p>
          <p className="guide-note">증권사마다 요구 서류가 조금씩 다르니 앱에서 미리 확인하세요.</p>
        </section>

        <section className="card guide-section">
          <h2>2. 개설부터 매수까지 4단계</h2>
          <ol className="step-list">
            <li>
              <b>계좌 개설</b> — 증권사 앱에서 ‘미성년 자녀 계좌’를 비대면으로 개설합니다. 지점 방문이 필요한 곳도
              있습니다.
            </li>
            <li>
              <b>증여 이체</b> — 부모 계좌에서 자녀 계좌로 이체합니다. 매달 나눠 보낼 계획이면 유기정기금 계약서를
              먼저 준비하세요.
            </li>
            <li>
              <b>증여세 신고</b> — 한도(미성년 2,000만 원/10년) 이내라도 신고를 권장합니다. 신고해야 자금 출처가
              남습니다.
            </li>
            <li>
              <b>주식 매수</b> — 자녀 계좌 안에서 매수합니다. 매매는 법정대리인인 부모가 할 수 있습니다.
            </li>
          </ol>
          <p>
            상품 유형에 따라 세금이 어떻게 달라지는지는 <a href="/simulator">증여자산 시뮬레이터</a>에서 숫자로
            확인할 수 있습니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>3. 가장 많이 하는 오해 — 주식이 오르면 그것도 증여인가요?</h2>
          <p>신고된 원금으로 산 주식의 가격 상승과 배당은 원칙적으로 추가 증여가 아닙니다.</p>
          <p className="guide-note">
            다만 <b>부모가 자녀 계좌를 운용하는 방식에 따라 수익을 증여로 과세한 사례가 있습니다.</b> 어떤
            운용이 안전하고 어떤 경우가 위험한지의 경계는 유료 매뉴얼에 세무사 답변으로 정리해 두었습니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>4. 매달 적립식으로 증여하려면 — 유기정기금</h2>
          <p>매달 자녀 계좌에 자동이체하면서 신고는 1회로 끝내는 방법이 유기정기금 증여 계약입니다.</p>
          <p>
            미래 지급분은 연 3% 할인 평가라 미성년 한도 2,000만 원으로 원금 약 2,280만 원(월 19만 원 × 10년)까지
            가능합니다.
          </p>
          <p>
            진행 방법은 <a href="/guide/annuity-gift-report">유기정기금 증여 신고 가이드</a>에서, 공제 기준은{' '}
            <a href="/guide/gift-deduction-limits">증여재산공제 한도 가이드</a>에서 확인하세요.
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
