import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout, ToolCta } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';

/** FAQ — 화면 렌더와 JSON-LD(FAQPage)의 단일 소스 */
const FAQ: { q: string; a: string }[] = [
  {
    q: '몇 년 지나면 그냥 넘어가나요?',
    a: '증여세 부과제척기간은 기본 10년, 무신고는 15년입니다. 시간이 해결해 주지 않습니다.',
  },
  {
    q: '현금으로 주면 모르지 않나요?',
    a: '자녀가 그 돈을 쓰는 순간(계좌 입금·자산 구매) 기록이 생깁니다. 자금출처조사에서 드러나는 전형적 사례입니다.',
  },
  {
    q: '한도 이내인데도 신고하는 게 좋나요?',
    a: '네. 가산세는 없지만 자금출처 증빙을 위해 신고를 권장합니다.',
  },
  {
    q: '기한 후 신고는 어떻게 하나요?',
    a: "홈택스에서 일반 신고와 같은 절차로 하되 '기한 후 신고'를 선택합니다. 스스로 신고하면 가산세 감면이 있습니다.",
  },
  {
    q: '이미 몇 년치가 쌓여 있어요',
    a: '원금 합계를 정리해 기한 후 신고로 수습할 수 있습니다. 금액이 크거나 복잡하면 세무사 상담을 권합니다.',
  },
];

const META = {
  title: '증여세 신고 안 하면 어떻게 되나요? — 가산세와 자금출처조사 | 이코치맘',
  description:
    '증여세 무신고 가산세 20%, 납부지연 가산세, 그리고 자녀가 집 살 때 받는 자금출처 소명까지 — 신고를 미루면 생기는 일과 지금 바로잡는 방법을 정리했습니다.',
  path: '/guide/no-report-risks',
};

export function NoReportRisks() {
  usePageMeta(META);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-noreport';
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
        <h1>증여세 신고 안 하면 어떻게 되나요? — 가산세와 자금출처조사</h1>
        <p className="guide-lede">신고를 미루면 생기는 일과 지금이라도 간단히 바로잡는 방법을 정리했습니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>
              세금이 0원이면 신고를 안 해도 당장 불이익은 없습니다. 하지만 <b>기록이 남지 않는 게 문제</b>입니다.
            </li>
            <li>
              세금이 나오는 증여를 신고하지 않으면 <b>무신고 가산세 20% + 납부지연 가산세</b>가 붙습니다.
            </li>
            <li>
              진짜 청구서는 나중에 옵니다. 자녀가 집·주식을 살 때 <b>자금출처를 소명</b>해야 할 수 있습니다.
            </li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 세금 0원인데 신고 안 하면?</h2>
          <p>공제 한도 이내 증여는 신고 의무가 없고 가산세도 없습니다.</p>
          <p>문제는 기록입니다. 신고하지 않은 돈은 나중에 “이 돈 어디서 났나요?”에 답할 공식 근거가 없습니다.</p>
          <p>
            신고는 세금을 내는 절차만이 아닙니다. “이 돈은 정당하게 받은 돈”이라는 국세청 공인 영수증을 만드는
            절차이기도 합니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>2. 세금이 나오는데 신고 안 하면 — 가산세</h2>
          <div className="table-scroll">
            <table className="info-table">
              <tbody>
                <tr>
                  <th>무신고</th>
                  <td>세금의 20%</td>
                </tr>
                <tr>
                  <th>부정 무신고</th>
                  <td>40%</td>
                </tr>
                <tr>
                  <th>납부지연</th>
                  <td>연 8.03% 수준</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>납부지연 가산세는 일할 계산합니다.</p>
          <p>
            예를 들어 내야 할 증여세가 100만 원이었다면 3년 뒤 적발 시 약 145만 원 안팎으로 불어납니다. 무신고
            가산세 20만 원과 납부지연 가산세 약 24만 원이 붙기 때문입니다. 미리 신고하면 100만 원으로 끝났을
            일입니다.
          </p>
          <p className="guide-note">
            스스로 늦게라도 기한 후 신고하면 무신고 가산세를 일부 감면받을 수 있습니다. 1개월 내 50%, 3개월 내
            30%, 6개월 내 20% 감면됩니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>3. 진짜 청구서는 나중에 온다 — 자금출처조사</h2>
          <p>국세청이 움직이는 시점은 보통 증여 당시가 아니라 자녀가 큰 자산을 살 때입니다.</p>
          <p>소득 없는 자녀가 집·차·주식을 사면 “자금 출처를 소명하라”는 안내문이 올 수 있습니다.</p>
          <p>
            이때 과거 10년치 계좌 이체 내역을 소급해 증여로 판정하면 본세와 가산세가 한꺼번에 붙습니다. 미리 신고해
            둔 사람은 신고 이력을 제출하면 끝납니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>4. 이미 늦었다면 — 기한 후 신고</h2>
          <ol className="step-list">
            <li>
              <b>지금까지 준 돈 정리</b> — 자녀 계좌로 입금한 원금 합계를 확인합니다. 여러 계좌라면 합산하세요.
            </li>
            <li>
              <b>기한 후 신고</b> — 홈택스에서 지금이라도 신고합니다. 빠를수록 가산세 감면 폭이 큽니다.
            </li>
            <li>
              <b>앞으로는 계획적으로</b> — 매달 주는 방식이면 유기정기금 계약으로 신고 1회로 정리할 수 있습니다.
            </li>
          </ol>
          <p>
            신고 방법은 <a href="/guide/annuity-gift-report">유기정기금 증여 신고 가이드</a>에서, 한도 확인은{' '}
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
