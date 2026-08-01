import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';

const FAQ = [
  { q: '결혼 전에 미리 받아도 되나요?', a: '혼인신고일 전 2년부터 가능합니다. 신고일을 기준으로 판단합니다.' },
  { q: '양가 부모에게 각각 받으면 어떻게 되나요?', a: '각자 수증자 기준입니다. 신랑·신부가 각각 1억 원과 기본공제 5,000만 원을 적용받을 수 있습니다.' },
  { q: '재혼도 되나요?', a: '혼인신고를 기준으로 적용합니다.' },
  { q: '출산 공제는 아이당인가요?', a: '아닙니다. 혼인·출산을 합산해 평생 1억 원 한도입니다.' },
  { q: '전세보증금으로 써도 되나요?', a: '용도 제한은 없습니다.' },
];

const META = {
  title: '결혼하면 1억을 더 받을 수 있다? — 혼인·출산 증여공제 | 이코치맘',
  description:
    '2024년 신설된 혼인·출산 증여공제 — 혼인신고 전후 2년, 출산 후 2년 내 직계존속 증여는 1억 원까지 추가 공제됩니다. 기본공제 5천만 원과 합치면 최대 1억 5천만 원.',
  path: '/guide/marriage-birth-deduction',
};

export function MarriageBirthDeduction() {
  usePageMeta(META);
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-marriage';
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
        <h1>결혼하면 1억을 더 받을 수 있다? — 혼인·출산 증여공제</h1>
        <p className="guide-lede">결혼·출산을 앞둔 자녀에게 적용되는 추가 공제를 정리했습니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>혼인신고 전후 2년 이내 부모(직계존속) 증여는 <b>1억 원</b>을 추가 공제합니다.</li>
            <li>출산(입양 포함) 후 2년 이내도 동일합니다. 단, 혼인·출산을 합쳐 평생 1억 원 한도입니다.</li>
            <li>기본공제 5,000만 원과 별도라 합치면 최대 <b>1억 5,000만 원</b>까지 세금이 0원입니다.</li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 2024년에 새로 생긴 제도</h2>
          <p>상증세법 개정으로 신설된 제도입니다.</p>
          <p>결혼·출산을 앞둔 자녀의 주거·양육 자금 지원을 위한 취지입니다.</p>
          <p>직계존속인 부모·조부모의 증여에 적용됩니다.</p>
        </section>

        <section className="card guide-section">
          <h2>2. 요건 정리</h2>
          <div className="table-scroll">
            <table className="info-table">
              <tbody>
                <tr><th>누가</th><td>직계존속</td></tr>
                <tr><th>혼인</th><td>혼인신고일 전후 2년 이내</td></tr>
                <tr><th>출산</th><td>출생일(입양신고일)부터 2년 이내</td></tr>
                <tr><th>한도</th><td>혼인+출산 합산 1억 원</td></tr>
                <tr><th>기본공제</th><td>5,000만 원과 별도 적용</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="card guide-section">
          <h2>3. 숫자로 보기</h2>
          <div className="stat-card">
            <p className="stat-title">한 사람이 직계존속에게 증여받는다면</p>
            <div className="stat-row">
              <div className="stat"><span>기본공제</span><b>5,000만</b></div>
              <div className="stat"><span>혼인·출산공제</span><b>1억</b></div>
              <div className="stat stat-accent"><span>최대</span><b>1억 5,000만</b></div>
            </div>
            <p className="stat-foot">최대 1억 5,000만 원까지 세금이 0원입니다.</p>
          </div>
          <p>양가 모두 활용하면 부부가 각자 자기 부모에게 받아 합산 3억 원까지 가능합니다.</p>
        </section>

        <section className="card guide-section">
          <h2>4. 주의할 점</h2>
          <p className="guide-note"><b>용도 제한은 없지만</b> 2년 기한을 지키는 것이 핵심입니다.</p>
          <p className="guide-note"><b>혼인 무효 등 사후 요건 이슈와 반환 특례 등</b> 세부 요건이 있어 큰 금액은 세무사 확인을 권장합니다.</p>
          <p className="guide-note"><b>10년 로드맵과 결합하면</b> 30세 구간 설계가 더 커집니다. <a href="/guide/gift-roadmap">증여 로드맵</a>과 <a href="/guide/gift-deduction-limits">증여재산공제 한도 가이드</a>를 참고하세요.</p>
        </section>

        <section className="card guide-section">
          <h2>5. 자주 묻는 질문</h2>
          {FAQ.map((f) => <details key={f.q} className="guide-faq"><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>

        <ManualPromo variant="inline" />
        <RelatedGuides current={META.path} />
        <p className="disclaimer">{DISCLAIMER}</p>
      </article>
    </GuideLayout>
  );
}
