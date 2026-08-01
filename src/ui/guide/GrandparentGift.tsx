import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout, ToolCta } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';

const FAQ = [
  { q: '외할머니도 합산되나요?', a: '네. 외조부모도 직계존속 그룹으로 합산됩니다.' },
  { q: '할증은 언제 붙나요?', a: '공제를 초과해 세액이 나올 때만 그 세액에 붙습니다.' },
  { q: '부모가 먼저 세상을 떠났으면?', a: '대습에 해당해 조부모가 손주에게 증여해도 세대생략 할증에서 제외됩니다.' },
  { q: '조부모가 주식계좌에 넣어줘도 되나요?', a: '가능합니다. 손주 명의 계좌로 보내고 신고해 두는 것을 권장합니다.' },
  { q: '며느리·사위 통해서 주면?', a: '기타친족 공제 1,000만 원 한도가 적용돼 오히려 불리할 수 있습니다.' },
];

const META = {
  title: '할머니가 손주에게 주는 돈, 세금이 더 붙나요? — 세대생략 할증 | 이코치맘',
  description:
    '조부모가 손주에게 주는 증여는 30% 할증? 공제 한도 이내면 할증도 0원입니다. 세대생략 할증의 원리와 조부모 증여를 활용하는 순서를 정리했습니다.',
  path: '/guide/grandparent-gift',
};

export function GrandparentGift() {
  usePageMeta(META);
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-grand';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      url: `${SITE_ORIGIN}${META.path}`,
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return <GuideLayout><article>
    <h1>할머니가 손주에게 주는 돈, 세금이 더 붙나요? — 세대생략 할증</h1>
    <p className="guide-lede">조부모 증여의 공제와 세대생략 할증을 쉽게 정리했습니다.</p>
    <section className="card tldr"><h2>3줄 요약</h2><ol>
      <li>조부모가 손주에게 준 돈은 부모 증여와 같은 <b>직계존속 그룹</b>으로 합산합니다.</li>
      <li>세대생략 할증 30%는 <b>세액</b>에 붙습니다. 세금이 0원이면 할증도 0원입니다.</li>
      <li>공제 한도 이내 조부모 증여라면 할증을 걱정하지 않아도 됩니다.</li>
    </ol></section>
    <section className="card guide-section"><h2>1. 조부모도 직계존속입니다</h2>
      <p>부모와 조부모에게 받은 증여는 같은 직계존속 그룹으로 합산합니다.</p>
      <p>10년간 공제 한도는 미성년 2,000만 원, 성년 5,000만 원입니다. 외조부모도 같습니다.</p>
      <p>관계별 한도는 <a href="/guide/gift-deduction-limits">증여재산공제 한도 가이드</a>에서 확인하세요.</p>
    </section>
    <section className="card guide-section"><h2>2. 세대생략 할증이란</h2>
      <p>조부모에서 부모를 거쳐 손주에게 가는 순서를 건너뛰면 산출세액의 30%를 할증합니다.</p>
      <p>미성년 손주에게 20억 원을 초과해 증여하면 할증률은 40%입니다.</p>
      <p className="guide-note"><b>핵심은 할증이 세액에 붙는다는 점입니다.</b> 공제 이내라 세액이 0원이면 할증도 0원입니다. 부모가 사망한 경우의 조부모 증여는 할증에서 제외됩니다.</p>
    </section>
    <section className="card guide-section"><h2>3. 숫자로 보기</h2>
      <div className="stat-card"><p className="stat-title">미성년 손주에게 조부모가 1,000만 원 증여</p><div className="stat-row">
        <div className="stat"><span>공제 이내</span><b>세금 0원</b></div><div className="stat stat-accent"><span>세대생략 할증</span><b>0원</b></div>
      </div><p className="stat-foot">다른 증여가 없다면 2,000만 원 공제 안에 들어갑니다.</p></div>
      <div className="stat-card"><p className="stat-title">공제를 소진한 뒤 1,000만 원 초과</p><div className="stat-row">
        <div className="stat"><span>세액 10%</span><b>100만 원</b></div><div className="stat"><span>할증 30%</span><b>30만 원</b></div><div className="stat stat-accent"><span>합계</span><b>130만 원</b></div>
      </div></div>
    </section>
    <section className="card guide-section"><h2>4. 활용 순서</h2><ol className="step-list">
      <li><b>기증여 확인</b> — 부모와 조부모가 준 금액을 함께 봅니다.</li>
      <li><b>공제 한도 비교</b> — 세액이 나오는 규모인지 먼저 확인합니다.</li>
      <li><b>순서 설계</b> — 세액이 나온다면 누구의 증여를 먼저 쓸지 검토합니다.</li>
    </ol><p>조부모도 유기정기금 계약으로 손주에게 정기 증여할 수 있습니다.</p><p>케이스별 유불리는 세무사 상담 영역입니다. 유료 매뉴얼에는 관련 세무사 답변을 정리해 두었습니다.</p><p>먼저 <a href="/guide/gift-deduction-limits">증여재산공제 한도</a>를 확인하세요.</p></section>
    <section className="card guide-section"><h2>5. 자주 묻는 질문</h2>{FAQ.map((f) => <details key={f.q} className="guide-faq"><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
    <ToolCta /><ManualPromo variant="inline" /><RelatedGuides current={META.path} /><p className="disclaimer">{DISCLAIMER}</p>
  </article></GuideLayout>;
}
