import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout, ToolCta } from './GuideLayout';

/** FAQ — 화면 렌더와 JSON-LD(FAQPage)의 단일 소스 */
const FAQ: { q: string; a: string }[] = [
  {
    q: '아빠와 엄마가 각각 5천만씩 줄 수 있나요?',
    a: '아니요. 직계존속은 합산해서 하나의 한도를 적용합니다.',
  },
  {
    q: '할아버지가 주는 것도 합산되나요?',
    a: '네. 직계존속 그룹으로 합산합니다. 단, 조부모가 손주에게 주는 증여는 세대생략 할증 30%에 유의하세요.',
  },
  {
    q: '사위·며느리에게 주면?',
    a: '기타친족 공제 한도인 1,000만 원을 적용합니다.',
  },
  {
    q: '10년은 언제부터 세나요?',
    a: '각 증여일에서 과거 10년을 소급해서 계산합니다.',
  },
  {
    q: '한도 이내면 신고 안 해도 되나요?',
    a: '신고 의무는 아니지만, 자금출처 증빙을 위해 신고를 권장합니다.',
  },
];

const META = {
  title: '세금 없이 줄 수 있는 금액은? 증여재산공제 한도 총정리 | 이코치맘',
  description:
    '배우자 6억, 성년 자녀 5천만, 미성년 2천만, 손주·사위·며느리까지 — 증여재산공제 한도와 10년 합산 규칙을 표로 정리했습니다.',
  path: '/guide/gift-deduction-limits',
};

export function GiftDeductionLimits() {
  usePageMeta(META);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-deduction';
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
        <h1>세금 없이 줄 수 있는 금액은? 증여재산공제 한도 총정리</h1>
        <p className="guide-lede">가족 관계에 따라 달라지는 공제 한도와 10년 합산 규칙을 한 번에 정리했습니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>
              가족에게는 일정 금액까지 <b>증여세가 0원</b> — 관계마다 한도가 다릅니다.
            </li>
            <li>
              한도는 <b>10년 단위로 합산</b> — 10년이 지나면 다시 채워집니다.
            </li>
            <li>
              한도를 꽉 채워 계획하려면 <b>유기정기금 방식</b>이 유리합니다.
            </li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 관계별 공제 한도</h2>
          <div className="table-scroll">            <table className="info-table">
              <thead>
                <tr>
                  <th>증여 관계</th>
                  <th>공제 한도</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>배우자</th>
                  <td>6억 원</td>
                </tr>
                <tr>
                  <th>직계존속 → 성년 자녀·손주</th>
                  <td>5,000만 원</td>
                </tr>
                <tr>
                  <th>직계존속 → 미성년 자녀·손주</th>
                  <td>2,000만 원</td>
                </tr>
                <tr>
                  <th>자녀 → 부모</th>
                  <td>5,000만 원</td>
                </tr>
                <tr>
                  <th>기타친족(사위·며느리 등)</th>
                  <td>1,000만 원</td>
                </tr>
                <tr>
                  <th>그 외 타인</th>
                  <td>공제 없음</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="guide-note">
            한도는 <b>받는 사람 기준</b>입니다. 직계존속은 그룹으로 합산하므로 아빠·엄마·조부모에게 받은 금액을
            모두 합쳐 하나의 한도를 적용합니다. 기타친족은 6촌 이내 혈족·4촌 이내 인척을 말합니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>2. 10년 합산이 핵심</h2>
          <p>각 증여일을 기준으로 과거 10년 동안 받은 증여를 소급해서 합산합니다.</p>
          <p>10년이 지난 증여분은 합산에서 빠지므로 공제 한도가 다시 채워집니다.</p>
          <div className="stat-card">
            <p className="stat-title">아이의 나이에 맞춰 10년마다 증여한다면</p>
            <div className="stat-row">
              <div className="stat">
                <span>0세</span>
                <b>2,000만원</b>
              </div>
              <div className="stat">
                <span>10세</span>
                <b>2,000만원</b>
              </div>
              <div className="stat stat-accent">
                <span>20세(성년)</span>
                <b>5,000만원</b>
              </div>
            </div>
            <p className="stat-foot">총 9,000만 원을 세금 없이 증여할 수 있습니다.</p>
          </div>
        </section>

        <section className="card guide-section">
          <h2>3. 한도를 넘으면 세율은?</h2>
          <p>공제 한도를 넘긴 금액인 과세표준에 아래 세율을 적용합니다.</p>
          <div className="table-scroll">            <table className="info-table">
              <thead>
                <tr>
                  <th>과세표준 구간</th>
                  <th>세율</th>
                </tr>
              </thead>
              <tbody>
                <tr><th>1억 원 이하</th><td>10%</td></tr>
                <tr><th>5억 원 이하</th><td>20%</td></tr>
                <tr><th>10억 원 이하</th><td>30%</td></tr>
                <tr><th>30억 원 이하</th><td>40%</td></tr>
                <tr><th>30억 원 초과</th><td>50%</td></tr>
              </tbody>
            </table>
          </div>
          <p className="guide-note">
            과세표준이 50만 원 미만이면 과세최저한으로 증여세를 부과하지 않습니다. 손주 등 세대생략 증여는 30%
            할증됩니다. 참고만 해두세요.
          </p>
        </section>

        <section className="card guide-section">
          <h2>4. 한도를 꽉 채우는 방법 — 유기정기금</h2>
          <p>미래 지급분은 연 3%로 할인 평가하기 때문에 같은 공제 한도로 더 많은 금액을 줄 수 있습니다.</p>
          <p>
            미성년 자녀의 2,000만 원 한도에서 일시금은 2,000만 원이 끝이지만, 10년 정기금이면 원금 약 2,280만
            원, 월 19만 원까지 가능합니다.
          </p>
          <p>
            자세한 신고 방법은 <a href="/guide/annuity-gift-report">유기정기금 가이드에서</a> 확인하세요.
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
        <p className="disclaimer">{DISCLAIMER}</p>
      </article>
    </GuideLayout>
  );
}
