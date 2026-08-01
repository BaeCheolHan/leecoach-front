import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout, ToolCta } from './GuideLayout';
import { ManualPromo } from './ManualPromo';

const FAQ: { q: string; a: string }[] = [
  {
    q: '잔액이 한도를 넘었는데 원금은 이내예요',
    a: '기준은 입금 원금입니다. 신고된(또는 신고할) 원금의 운용 수익은 추가 증여가 아닙니다.',
  },
  {
    q: '몇 년 전 입금까지 계산해야 하나요?',
    a: '각 증여일 기준 과거 10년을 소급 합산합니다.',
  },
  {
    q: '아이 세뱃돈으로 받은 돈도 원금에 넣나요?',
    a: '타인에게 받은 세뱃돈은 부모 증여와 별개입니다. 다만 부모 계좌를 거쳤다면 구분이 어려워질 수 있습니다.',
  },
  {
    q: '기한 후 신고하면 불이익이 있나요?',
    a: '세금이 0원이면 가산세도 0원입니다. 세금이 있다면 가산세가 붙지만 자진 신고 감면이 있습니다.',
  },
  {
    q: '어디서부터 시작해야 할지 모르겠어요',
    a: '아이 계좌 거래내역서를 모두 내려받아 부모 입금분만 합산하는 것이 1단계입니다.',
  },
];

const META = {
  title: '아이 계좌에 이미 돈이 쌓여 있나요? — 늦은 증여 신고 자가진단 | 이코치맘',
  description:
    '신고 없이 아이 계좌에 입금해 온 부모님을 위한 자가진단 3단계 — 원금 합계 계산, 한도 비교, 기한 후 신고까지. 지금 확인하면 간단히 정리됩니다.',
  path: '/guide/late-report-checklist',
};

export function LateReportChecklist() {
  usePageMeta(META);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-late';
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
        <h1>아이 계좌에 이미 돈이 쌓여 있나요? — 늦은 증여 신고 자가진단</h1>
        <p className="guide-lede">신고를 놓쳤더라도 지금 현황부터 확인하면 차근차근 정리할 수 있습니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>신고 없이 아이 계좌에 돈을 넣어온 상황은 생각보다 흔하며, 지금이라도 정리할 수 있습니다.</li>
            <li>기준은 잔액이 아니라 부모가 실제 입금한 원금 합계입니다.</li>
            <li>한도 이내면 신고로 기록을 남기면 되고, 초과했다면 빠를수록 가산세 부담이 줄어듭니다.</li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 먼저, 겁먹지 않아도 되는 이유</h2>
          <p>아이 계좌에 조금씩 돈을 넣다가 신고 시기를 놓친 부모님은 매우 많습니다.</p>
          <p>
            세법에도 스스로 바로잡는 사람을 위한 기한 후 신고와 가산세 감면 장치가 있습니다. 중요한 것은 지금
            현황을 정확히 아는 것입니다. 미리 알면 정리는 의외로 간단할 수 있습니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>2. 자가진단 3단계</h2>
          <ol className="step-list">
            <li>
              <b>원금 합계 계산</b> — 아이 명의 모든 계좌(입출금·주식·청약)에 부모가 입금한 원금을 더합니다.
              주식 수익과 이자는 제외합니다. 신고된 원금의 운용 수익은 증여가 아닙니다.
            </li>
            <li>
              <b>한도와 비교</b> — 최근 10년 내 입금 원금이 미성년 2,000만 원(성년 5,000만 원) 이내인지
              확인합니다.
            </li>
            <li>
              <b>결론 내리기</b> — 한도 이내라면 지금 신고해 기록을 남기면 됩니다. 초과라면 기한 후 신고
              대상이며, 스스로 신고하면 가산세를 감면받을 수 있습니다.
            </li>
          </ol>
          <div className="table-scroll">
            <table className="info-table">
              <tbody>
                <tr><th>1개월 내</th><td>50% 감면</td></tr>
                <tr><th>3개월 내</th><td>30% 감면</td></tr>
                <tr><th>6개월 내</th><td>20% 감면</td></tr>
              </tbody>
            </table>
          </div>
          <p className="guide-note">감면 기간은 법정 신고기한이 지난 뒤 기한 후 신고를 한 시점을 기준으로 봅니다.</p>
        </section>

        <section className="card guide-section">
          <h2>3. 이런 경우라면 판단이 더 필요합니다</h2>
          <ul>
            <li>부모가 아이 계좌에서 돈을 뺐다 넣었다 한 경우 — 차명계좌로 볼지가 쟁점입니다.</li>
            <li>수년 전부터 매달 넣어온 경우 — 유기정기금으로 소급할지, 합산 신고할지가 쟁점입니다.</li>
            <li>여러 계좌에 흩어져 있고 일부는 기억이 나지 않는 경우</li>
            <li>이미 원금이 한도를 넘은 경우의 신고 순서</li>
          </ul>
          <p>
            이 네 가지는 상황마다 유불리가 달라 일률적인 답이 없습니다. 유료 매뉴얼에는 세무사가 답한 실제
            케이스별 판단 기준을 정리해 두었습니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>4. 앞으로는 계획적으로</h2>
          <p>정리를 마친 뒤에는 매달 증여할 돈을 유기정기금 계약으로 묶어 신고 1회로 관리할 수 있습니다.</p>
          <p>
            방법은 <a href="/guide/annuity-gift-report">유기정기금 증여 신고 가이드</a>에서, 신고를 미룰 때의
            쟁점은 <a href="/guide/no-report-risks">증여세 무신고 위험 가이드</a>에서 확인하세요.
          </p>
        </section>

        <section className="card guide-section">
          <h2>5. 자주 묻는 질문</h2>
          {FAQ.map((f) => (
            <details key={f.q} className="guide-faq"><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </section>

        <ToolCta />
        <ManualPromo variant="inline" />
        <p className="disclaimer">{DISCLAIMER}</p>
      </article>
    </GuideLayout>
  );
}
