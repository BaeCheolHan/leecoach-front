import { useEffect, type ReactNode } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout, ToolCta } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';

/** aJsx: 화면 렌더 전용(링크 포함 가능). JSON-LD에는 항상 평문 a를 사용한다. */
const FAQ: { q: string; a: string; aJsx?: ReactNode }[] = [
  { q: '세뱃돈은 얼마까지 괜찮나요?', a: '법에 금액 기준이 없습니다. 사회통념상 수준의 용돈·세뱃돈은 문제 삼지 않는 것이 실무입니다.' },
  { q: '세뱃돈을 아이 주식계좌에 넣으면요?', a: '자산 취득이 되어 증여로 해석될 수 있습니다. 금액이 쌓인다면 신고를 권합니다.' },
  { q: '친척이 준 세뱃돈은 누구 기준으로 보나요?', a: '준 사람 기준입니다. 조부모는 직계존속 그룹으로 부모와 합산되고, 삼촌·이모 등은 기타친족 한도로 봅니다.' },
  {
    q: '조부모가 주신 용돈도 합산되나요?',
    a: '직계존속 그룹으로 합산됩니다. 자세한 내용은 공제 한도 가이드를 참고하세요.',
    aJsx: (
      <>
        직계존속 그룹으로 합산됩니다. 자세한 내용은{' '}
        <a href="/guide/gift-deduction-limits">공제 한도 가이드</a>를 참고하세요.
      </>
    ),
  },
  { q: '학원비·등록금을 대신 내주는 건요?', a: '부양의무자가 지급하는 통상적인 교육비·생활비는 비과세입니다.' },
];

const META = {
  title: '세뱃돈과 용돈은 증여인가요? — 비과세의 경계 | 이코치맘',
  description: '세뱃돈과 용돈은 어디까지 비과세일까? 쓰면 용돈, 모으면 증여 — 아이 돈 관리에서 가장 헷갈리는 비과세의 경계를 정리했습니다.',
  path: '/guide/tax-free-money',
};

export function TaxFreeMoney() {
  usePageMeta(META);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-taxfree';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
      url: `${SITE_ORIGIN}${META.path}`,
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <GuideLayout>
      <article>
        <h1>세뱃돈과 용돈은 증여인가요? — 비과세의 경계</h1>
        <p className="guide-lede">아이에게 들어온 돈의 출처와 쓰임을 나누면 비과세의 경계가 선명해집니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>사회통념상 세뱃돈·용돈·축의금은 비과세입니다. 단, ‘쓰는 돈’일 때의 이야기입니다.</li>
            <li>그 돈을 모아 예금·주식을 사는 순간 ‘자산 취득’이 되어 증여 문제가 생길 수 있습니다.</li>
            <li>모아줄 계획이라면 처음부터 증여 신고로 기록을 남기는 것이 깔끔합니다.</li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 세뱃돈은 세금 안 내는 거 아니었어요?</h2>
          <p>사회통념상 인정되는 용돈·세뱃돈·축의금은 비과세입니다.</p>
          <p>
            다만 세법상 ‘용돈’은 생활비나 교육비처럼 실제 소비되는 돈을 말합니다. 얼마까지라는 구체적인 금액
            기준은 법에 없습니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>2. 경계는 ‘사용’이다</h2>
          <p>쓰면 용돈이지만, 모아서 자산을 사면 증여로 볼 수 있습니다.</p>
          <div className="table-scroll">
            <table className="info-table">
              <tbody>
                <tr><th>학원비 사용</th><td>비과세</td></tr>
                <tr><th>주식 매수</th><td>증여 쟁점</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            예를 들어 세뱃돈으로 학원비를 내면 비과세지만, 세뱃돈을 모아 주식을 사면 투자금 증여로 해석될 수
            있습니다. 아이 계좌에 목돈을 모아줄 계획이라면 처음부터 증여 신고로 기록을 남기는 편이 깔끔합니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>3. 정리 — 아이 돈 관리 원칙 2가지</h2>
          <ol className="step-list">
            <li><b>쓸 돈</b> — 생활비·학원비는 비과세이므로 걱정하지 않아도 됩니다.</li>
            <li><b>모을 돈</b> — 증여 신고로 기록을 남깁니다.</li>
          </ol>
          <p>
            모아둔 세뱃돈의 소명, 초과분의 비과세 주장 논리, 그리고 아동수당·부모급여 같은{' '}
            <b>국가지원금을 비과세 자산으로 지키는 관리법</b>은 상황별 판단이 필요한 영역이라, 유료 매뉴얼에
            세무사가 답한 케이스별 쟁점으로 정리해 두었습니다.
          </p>
          <p>
            가족별 합산 기준은 <a href="/guide/gift-deduction-limits">증여재산공제 한도 가이드</a>에서 확인하세요.
          </p>
        </section>

        <section className="card guide-section">
          <h2>4. 자주 묻는 질문</h2>
          {FAQ.map((f) => (
            <details key={f.q} className="guide-faq"><summary>{f.q}</summary><p>{f.aJsx ?? f.a}</p></details>
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
