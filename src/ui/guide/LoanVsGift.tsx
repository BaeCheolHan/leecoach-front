import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';

/** FAQ — 화면 렌더와 JSON-LD(FAQPage)의 단일 소스 */
const FAQ: { q: string; a: string }[] = [
  {
    q: '차용증을 나중에 쓰면 안 되나요?',
    a: '소급 작성은 인정받기 어렵습니다. 돈이 오가기 전에 쓰고 시점을 증빙하세요.',
  },
  {
    q: '미성년 자녀에게 빌려줄 수 있나요?',
    a: '소득이 없어 상환 능력이 인정되기 어렵습니다. 어린 자녀는 증여가 정석입니다.',
  },
  {
    q: '공증을 꼭 받아야 하나요?',
    a: '필수는 아닙니다. 확정일자, 내용증명, 이메일 등으로 작성 시점을 증명할 수 있으면 됩니다.',
  },
  {
    q: '이자를 받으면 세금이 있나요?',
    a: '가족이라도 이자를 받으면 이자소득으로 원천징수(지방세 포함 27.5%) 신고 이슈가 생깁니다. 세무사 확인을 권합니다.',
  },
  {
    q: '빌려준 돈을 안 갚기로 했어요',
    a: '채무 면제도 증여입니다. 면제 시점에 증여세 신고 대상이 됩니다.',
  },
];

const META = {
  title: '부모 자식 간 돈 거래, 빌린 걸까 증여일까 — 차용증 vs 증여계약서 | 이코치맘',
  description:
    '가족 간 돈 거래는 원칙적으로 증여로 추정됩니다. 차용으로 인정받는 조건(차용증·이자·상환 기록), 무이자 대여 한도, 증여가 나은 경우까지 정리했습니다.',
  path: '/guide/loan-vs-gift',
};

export function LoanVsGift() {
  usePageMeta(META);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-loan';
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
        <h1>부모 자식 간 돈 거래, 빌린 걸까 증여일까 — 차용증 vs 증여계약서</h1>
        <p className="guide-lede">가족 간 돈 거래를 차용으로 인정받는 조건과 증여가 더 나은 경우를 정리했습니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>
              가족 간 돈 거래는 세법상 일단 증여로 추정됩니다. <b>“빌려준 것”이라고 하려면 증거가 필요합니다.</b>
            </li>
            <li>
              차용 인정 조건은 <b>차용증 + 이자·만기 약정 + 실제 상환 이체 기록</b>입니다.
            </li>
            <li>
              갚을 계획이 없다면 처음부터 <b>증여계약서를 쓰고 신고하는 것이 깔끔합니다.</b>
            </li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 왜 '빌려줬다'가 잘 안 통할까?</h2>
          <p>세법은 가족 간 자금 이동을 원칙적으로 증여로 추정합니다.</p>
          <p>“나중에 받을 거예요”라는 말만으로는 인정되지 않습니다. 서류와 이체 기록으로 증명해야 합니다.</p>
          <p>
            특히 소득이 없는 미성년 자녀는 상환 능력이 없어 차용으로 인정받기가 사실상 어렵습니다. 어린 자녀에게는
            증여가 정석입니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>2. 차용으로 인정받는 3가지 조건</h2>
          <ol className="step-list">
            <li>
              <b>차용증 작성</b> — 금액·이자율·만기·상환 방법을 명시합니다. 확정일자, 내용증명, 이메일 발송 등으로
              작성 시점도 증명할 수 있게 준비하세요.
            </li>
            <li>
              <b>이자·원금의 실제 지급</b> — 약정대로 이체한 기록이 남아야 합니다. 기록 없는 차용증은 종이일 뿐입니다.
            </li>
            <li>
              <b>상환 능력</b> — 빌리는 사람에게 갚을 소득과 계획이 있어야 자연스럽게 인정됩니다.
            </li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>3. 무이자로 빌려줘도 되나요? — 연 4.6%의 기준</h2>
          <p>
            세법상 적정이자율은 연 4.6%입니다. 무이자나 낮은 이자로 빌려주면 아낀 이자만큼을 증여로 볼 수 있습니다.
          </p>
          <p>
            단, 그 이자 차익이 연 1,000만 원 미만이면 증여세를 과세하지 않습니다(상증세법 §41조의4).
          </p>
          <p>
            1,000만 원 ÷ 4.6% ≈ 2억 1,700만 원이므로 이 금액 정도까지는 무이자 대여도 이자 증여 문제는 없습니다.
            원금 상환 의무는 여전히 남습니다.
          </p>
          <p className="guide-note">무이자라도 차용증과 원금 상환 기록은 반드시 필요합니다.</p>
        </section>

        <section className="card guide-section">
          <h2>4. 차용 vs 증여, 뭐가 나은가</h2>
          <div className="table-scroll">
          <table className="info-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>차용</th>
                <th>증여</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>서류</th>
                <td>차용증</td>
                <td>증여계약서</td>
              </tr>
              <tr>
                <th>세금</th>
                <td>증여세 없음</td>
                <td>공제 한도 내 0원</td>
              </tr>
              <tr>
                <th>조건</th>
                <td>실제 상환 필수</td>
                <td>신고만 하면 끝</td>
              </tr>
              <tr>
                <th>어울리는 경우</th>
                <td>갚을 계획이 있을 때</td>
                <td>갚을 계획이 없을 때</td>
              </tr>
            </tbody>
          </table>
          </div>
          <p>
            차용을 택해 이자를 받으면 이자소득세 이슈가 생기는 점도 참고하세요. 그리고 나중에 갚지 않기로 하면
            채무를 면제한 시점에 증여세가 과세됩니다.
          </p>
          <p>
            증여를 택했다면 증여계약서를 쓰고 신고하세요. 미성년 자녀 정기 증여는{' '}
            <a href="/guide/annuity-gift-report">유기정기금 증여 신고 가이드</a>를 참고하세요.
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

        <ManualPromo variant="inline" />
        <RelatedGuides current={META.path} />
        <p className="disclaimer">{DISCLAIMER}</p>
      </article>
    </GuideLayout>
  );
}
