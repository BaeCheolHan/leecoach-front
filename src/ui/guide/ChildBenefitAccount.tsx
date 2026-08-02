import { useEffect } from 'react';
import { DISCLAIMER, SITE_ORIGIN } from '../../config';
import { usePageMeta } from '../usePageMeta';
import { GuideLayout } from './GuideLayout';
import { ManualPromo } from './ManualPromo';
import { RelatedGuides } from './RelatedGuides';

/** FAQ — 화면 렌더와 JSON-LD(FAQPage)의 단일 소스 */
const FAQ: { q: string; a: string }[] = [
  {
    q: '아동수당을 모아서 아이 주식계좌에서 투자해도 되나요?',
    a: '네. 아이 명의 계좌에서 아이의 돈으로 사는 것이므로 가능합니다. 다만 ETF 등을 사서 장기 보유하는 원칙을 지키는 편이 좋습니다.',
  },
  {
    q: '이미 부모 계좌로 받고 있었는데 어떡하죠?',
    a: '지금부터라도 아이 명의 계좌로 입금 경로를 바꾸는 것이 우선입니다. 이미 쌓인 돈의 이체 기록 정리와 소명은 상황별 판단이 필요한 영역으로, 세무사가 검토한 유료 매뉴얼에 케이스별로 정리해 두었습니다.',
  },
  {
    q: '아이 계좌에서 난 수익에도 증여세가 붙나요?',
    a: '신고한 돈이나 비과세 원천의 돈이 아이 계좌 안에서 스스로 불어난 가치에는 증여세를 묻기 어렵습니다. 다만 부모가 잦은 매매로 굴린 경우에는 부모의 기여로 본 수익이라는 과세 쟁점이 생길 수 있습니다.',
  },
];

const META = {
  title: '아동수당도 증여세 신고해야 하나요? — 아이 계좌로 받는 3단계 방어 전략 | 이코치맘',
  description:
    '아동수당은 증여세 신고 대상일까? 비과세 원리와 부모 이체로 생기는 오해, 아이 명의 계좌·자금 분리·장기 보유의 3단계 관리 전략을 정리했습니다.',
  path: '/guide/child-benefit-account',
};

export function ChildBenefitAccount() {
  usePageMeta(META);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld-child-benefit';
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
        <h1>아동수당도 증여세 신고해야 하나요? — 아이 계좌로 받는 3단계 방어 전략</h1>
        <p className="guide-lede">세금을 내는 돈인지보다, 누가 준 돈인지 기록에 남는 경로가 더 중요합니다.</p>

        <section className="card tldr">
          <h2>3줄 요약</h2>
          <ol>
            <li>아동수당(부모급여)은 국가가 법에 따라 아이에게 지급하는 돈으로, 부모의 증여가 아니며 증여세 신고 대상도 아닙니다.</li>
            <li>부모 계좌를 거쳐 아이 계좌로 옮기면 통장에는 ‘부모→자녀 이체’로 남아 증여로 오해받을 수 있습니다.</li>
            <li>처음부터 아이 명의 계좌로 받고, 증여금과 지원금을 분리하며, 투자한다면 장기 보유하세요.</li>
          </ol>
        </section>

        <section className="card guide-section">
          <h2>1. 아동수당은 증여가 아닙니다</h2>
          <p>증여는 타인으로부터 무상으로 재산을 받는 것입니다.</p>
          <p>
            아동수당은 국가가 법에 따라 아이에게 직접 지급하는 돈입니다. 부모가 아이에게 무상으로 주는 재산이
            아니므로 증여세 신고 대상이 아닙니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>2. 문제는 세금이 아니라 ‘기록’입니다</h2>
          <p>비과세인데도 오해가 생기는 이유는 돈을 받는 경로 때문입니다.</p>
          <p>
            아동수당을 부모 계좌로 받았다가 아이 계좌로 옮기면, 나중에 통장 기록만 봤을 때는 ‘부모→자녀 이체’로
            보입니다. 원래는 국가 지원금이지만 부모가 준 증여금처럼 오해받을 수 있는 것입니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>3. 아이 계좌를 지키는 3단계 방어 전략</h2>
          <ol className="step-list">
            <li><b>1단계: 입금 경로</b> — 처음부터 반드시 아이 명의 계좌로 받습니다. 부모 계좌를 거치면 증여 오해가 생길 수 있습니다.</li>
            <li><b>2단계: 계좌 분리</b> — 부모가 주는 증여금과 국가 지원금을 서로 다른 계좌로 관리하면 자금 출처 소명이 명확해집니다.</li>
            <li><b>3단계: 투자 방식</b> — 부모가 아이 계좌에서 잦은 단타 매매를 하면 과세 위험이 커집니다. ETF 등을 사서 장기 보유(Hold)하세요. 아이 계좌 안에서 스스로 불어난 가치에는 증여세를 묻기 어렵습니다.</li>
          </ol>
          <p>
            부모급여의 상세 관리, 이미 꼬인 이체 케이스의 수습, 흩어진 계좌 정리, 소급 신고는 상황별 판단이 필요합니다.
            구체적인 케이스별 정리는 세무사가 검토한 유료 매뉴얼에 담아 두었습니다.
          </p>
        </section>

        <section className="card guide-section">
          <h2>4. 자주 묻는 질문</h2>
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
