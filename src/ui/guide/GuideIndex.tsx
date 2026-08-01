import { GuideLayout } from './GuideLayout';
import { usePageMeta } from '../usePageMeta';
import { ManualPromo } from './ManualPromo';

const ARTICLES = [
  {
    path: '/guide/minor-stock-account',
    title: '미성년 자녀 주식계좌 만들기 — 서류부터 증여 신고까지',
    summary: '필요한 서류부터 비대면 계좌 개설, 증여세 신고와 주식 매수 순서까지 한 번에 정리했습니다.',
  },
  {
    path: '/guide/gift-deduction-limits',
    title: '세금 없이 줄 수 있는 금액은? 증여재산공제 한도 총정리',
    summary: '배우자부터 자녀·손주·사위·며느리까지, 관계별 공제 한도와 10년 합산 규칙을 표로 정리했습니다.',
  },
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
