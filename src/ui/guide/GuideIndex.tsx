import { GuideLayout } from './GuideLayout';
import { usePageMeta } from '../usePageMeta';

const ARTICLES = [
  {
    path: '/guide/annuity-gift-report',
    title: '자녀에게 매달 증여하고 세금 0원 만들기 — 유기정기금 증여 신고 가이드',
    summary:
      '유기정기금 증여가 무엇인지, 왜 절세가 되는지, 계약서 준비부터 홈택스 신고까지 전체 흐름을 한 번에 정리했습니다.',
  },
];

export function GuideIndex() {
  usePageMeta({
    title: '증여 가이드 | 이코치맘',
    description:
      '자녀 증여, 유기정기금, 증여세 신고를 쉽게 풀어쓴 가이드 모음. 계약서 작성부터 홈택스 신고까지.',
    path: '/guide',
  });
  return (
    <GuideLayout>
      <h1>증여 가이드</h1>
      <p className="guide-lede">자녀에게 현명하게 증여하는 방법을 하나씩 쉽게 정리합니다.</p>
      {ARTICLES.map((a) => (
        <a key={a.path} className="card guide-card" href={a.path}>
          <h2>{a.title}</h2>
          <p>{a.summary}</p>
          <span className="guide-more">읽어보기 →</span>
        </a>
      ))}
    </GuideLayout>
  );
}
