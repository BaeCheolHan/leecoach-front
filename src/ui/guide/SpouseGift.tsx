import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout } from './GuideLayout';
import { ManualPromo } from './ManualPromo';

const FAQ = [
  { q: '생활비로 매달 300 보내는데 신고하나요?', a: '통상적인 생활비 이체는 증여가 아니므로 신고하지 않습니다.' },
  { q: '공동명의로 바꾸면?', a: '지분 이전은 증여입니다. 6억 원 이내면 세금은 0원이지만 신고를 권장합니다.' },
  { q: '맞벌이 부부 돈 섞임', a: '생활비 계좌를 분리해 두면 자금 성격을 소명하는 데 유리합니다.' },
  { q: '6억 넘게 주면?', a: '10년 합산 6억 원을 넘는 부분에 세율을 적용합니다.' },
  { q: '이혼하면?', a: '재산분할은 증여가 아닙니다. 위자료 등은 별도로 판단합니다.' },
];
const META = {
  title: '부부 사이에도 증여세가 있나요? — 배우자 공제 6억의 활용 | 이코치맘',
  description: '부부간 생활비 이체는 증여일까? 배우자 증여 공제 6억 원의 의미와 활용, 그리고 조심할 점을 정리했습니다.',
  path: '/guide/spouse-gift',
};

export function SpouseGift() {
  usePageMeta(META);
  useEffect(() => {
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.id = 'faq-jsonld-spouse';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })), url: `${SITE_ORIGIN}${META.path}` });
    document.head.appendChild(script); return () => script.remove();
  }, []);
  return <GuideLayout><article>
    <h1>부부 사이에도 증여세가 있나요? — 배우자 공제 6억의 활용</h1>
    <p className="guide-lede">생활비 이체와 자산 이전의 차이를 간단히 짚어봅니다.</p>
    <section className="card tldr"><h2>3줄 요약</h2><ol>
      <li>부부간에도 증여세는 있습니다. 다만 <b>10년간 6억 원</b>까지 공제합니다.</li>
      <li>통상적인 생활비와 공동생활 비용 이체는 증여가 아닙니다.</li>
      <li>자산을 옮기는 규모라면 신고해 기록을 남기는 것이 안전합니다.</li>
    </ol></section>
    <section className="card guide-section"><h2>1. 생활비 이체, 걱정 안 해도 됩니다</h2>
      <p>부부의 공동생활에 쓰는 생활비·교육비·경조사는 증여가 아닙니다.</p><p>매달 생활비를 배우자 계좌로 보내는 것도 통상적인 일입니다.</p><p>구분해서 볼 것은 생활비가 아니라 자산 형성 규모의 이동입니다.</p>
    </section>
    <section className="card guide-section"><h2>2. 6억 공제의 의미</h2>
      <p>배우자에게 준 재산은 10년 합산 6억 원까지 증여세가 0원입니다.</p><p>주택 지분, 예금, 주식 같은 자산 이전에 활용할 수 있습니다.</p><p>부부가 각자 자산을 만들어두면 향후 금융소득과 양도 계획에서 선택지가 넓어질 수 있습니다.</p>
    </section>
    <section className="card guide-section"><h2>3. 조심할 점</h2>
      <p className="guide-note"><b>6억 원을 넘으면</b> 초과분에 증여세가 부과됩니다.</p>
      <p className="guide-note"><b>단기 매도 목적이라면</b> 부동산·주식의 이월과세 등 별도 규정이 있을 수 있어 세무사 확인이 필요합니다.</p>
      <p className="guide-note"><b>큰 금액이라면</b> 신고로 기록을 남기는 편이 나중에 소명하기 유리합니다.</p>
    </section>
    <section className="card guide-section"><h2>4. 신고는 간단합니다</h2>
      <ol className="step-list"><li><b>이전 자산 확인</b> — 금액과 이전일을 정리합니다.</li><li><b>10년 합산 확인</b> — 기존 배우자 증여와 합칩니다.</li><li><b>홈택스 신고</b> — 일반 증여세 신고 절차로 기록을 남깁니다.</li></ol>
      <p>한도는 <a href="/guide/gift-deduction-limits">증여재산공제 한도 가이드</a>, 신고하지 않았을 때의 문제는 <a href="/guide/no-report-risks">무신고 위험 가이드</a>를 참고하세요.</p>
    </section>
    <section className="card guide-section"><h2>5. 자주 묻는 질문</h2>{FAQ.map((f) => <details key={f.q} className="guide-faq"><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
    <ManualPromo variant="inline" /><p className="disclaimer">{DISCLAIMER}</p>
  </article></GuideLayout>;
}
