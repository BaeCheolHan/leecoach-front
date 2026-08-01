import { GuideLayout } from './GuideLayout';
import { usePageMeta } from '../usePageMeta';
import { ManualPromo } from './ManualPromo';
import { ARTICLES } from './articles';

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
      <ManualPromo variant="card" />
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
