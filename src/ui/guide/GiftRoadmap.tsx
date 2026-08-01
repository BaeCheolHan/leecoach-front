import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout, ToolCta } from './GuideLayout';
import { ManualPromo } from './ManualPromo';

const FAQ = [
  { q: '꼭 10년을 채워야 하나요?', a: '각 증여일에서 10년을 소급합니다. 앞선 증여에서 10년이 지나면 새 한도를 쓸 수 있습니다.' },
  { q: '0세에 시작 못했어요', a: '늦게 시작해도 구간 수만 줄어들 뿐 원리는 같습니다.' },
  { q: '1억 4천을 한 번에 주면?', a: '공제 후 초과분에 세율을 적용합니다. 나누어야 세금이 0원입니다.' },
  { q: '물가가 오르면 한도도 오르나요?', a: '한도는 법 개정 사항입니다. 현재 기준으로 계획하세요.' },
  { q: '두 자녀면 각각 되나요?', a: '공제는 받는 사람 기준이므로 자녀마다 각각 적용됩니다.' },
];
const META = {
  title: '0세부터 30세까지, 세금 없이 1억 4천 물려주는 로드맵 | 이코치맘',
  description: '10년 주기 증여 공제를 활용하면 0세 2천만, 10세 2천만, 20세 5천만, 30세 5천만 — 총 1억 4천만 원을 세금 없이 증여할 수 있습니다. 시기별 실행 로드맵.',
  path: '/guide/gift-roadmap',
};

export function GiftRoadmap() {
  usePageMeta(META);
  useEffect(() => {
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.id = 'faq-jsonld-roadmap';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })), url: `${SITE_ORIGIN}${META.path}` });
    document.head.appendChild(script); return () => script.remove();
  }, []);
  return <GuideLayout><article>
    <h1>0세부터 30세까지, 세금 없이 1억 4천 물려주는 로드맵</h1>
    <p className="guide-lede">10년 주기 공제를 놓치지 않는 시기별 실행 순서입니다.</p>
    <section className="card tldr"><h2>3줄 요약</h2><ol>
      <li>공제 한도는 10년마다 다시 쓸 수 있어 일찍 시작할수록 기회가 많습니다.</li>
      <li>0세·10세·20세·30세 네 번이면 총 <b>1억 4,000만 원</b>을 세금 없이 옮길 수 있습니다.</li>
      <li>각 구간을 유기정기금으로 채우면 같은 한도로 더 많이 줄 수 있습니다.</li>
    </ol></section>
    <section className="card guide-section"><h2>1. 로드맵 한눈에 보기</h2><div className="table-scroll"><table className="info-table"><thead><tr><th>시기</th><th>한도</th><th>누계</th></tr></thead><tbody>
      <tr><th>0세</th><td>2,000만</td><td>2,000만</td></tr><tr><th>10세</th><td>2,000만</td><td>4,000만</td></tr><tr><th>20세(성년)</th><td>5,000만</td><td>9,000만</td></tr><tr><th>30세</th><td>5,000만</td><td>1억 4,000만</td></tr>
    </tbody></table></div></section>
    <section className="card guide-section"><h2>2. 시기별 실행 체크</h2><ol className="step-list">
      <li><b>0세</b> — 출생 후 계좌를 열고 첫 증여와 신고를 합니다. <a href="/guide/minor-stock-account">미성년 주식계좌 가이드</a>도 참고하세요.</li>
      <li><b>10세</b> — 두 번째 구간입니다. 앞선 증여에서 10년이 지났는지 확인합니다.</li>
      <li><b>20세</b> — 성년 공제 한도 5,000만 원을 적용합니다.</li>
      <li><b>30세</b> — 결혼·주택 준비 자금과 연결해 봅니다. 혼인·출산 공제 등 별도 제도는 요건이 있으므로 세무사 확인이 필요합니다.</li>
    </ol></section>
    <section className="card guide-section"><h2>3. 유기정기금으로 각 구간 극대화</h2>
      <p>미성년 구간은 월 19만 원씩 10년, 원금 2,280만 원을 지급해도 평가액은 1,969만 원으로 한도 안에 들어갑니다.</p><p>성년 구간도 같은 원리로 활용할 수 있습니다.</p><p>실행 방법은 <a href="/guide/annuity-gift-report">유기정기금 증여 신고 가이드</a>에서 확인하세요.</p><p className="guide-note">0세 첫 구간을 놓치지 않고 꽉 채우는 실전 플랜과 세무사 신고 요령은 유료 매뉴얼에 정리되어 있습니다.</p>
    </section>
    <section className="card guide-section"><h2>4. 주의: 로드맵이 무너지는 경우</h2>
      <p>중간에 목돈을 한 번에 주면 10년 합산으로 한도를 넘을 수 있습니다. 항상 기증여 확인이 먼저입니다.</p><p>신고를 미뤄왔다면 <a href="/guide/no-report-risks">증여세 무신고 위험 가이드</a>에서 지금 정리하는 방법을 확인하세요.</p><p className="guide-note">자산 증식분은 한도와 무관합니다. 신고된 원금을 기준으로 봅니다.</p>
    </section>
    <section className="card guide-section"><h2>5. 자주 묻는 질문</h2>{FAQ.map((f) => <details key={f.q} className="guide-faq"><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
    <ToolCta /><ManualPromo variant="inline" /><p className="disclaimer">{DISCLAIMER}</p>
  </article></GuideLayout>;
}
