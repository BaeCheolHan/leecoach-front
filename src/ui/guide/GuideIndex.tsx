import { GuideLayout } from './GuideLayout';
import { usePageMeta } from '../usePageMeta';
import { ManualPromo } from './ManualPromo';

const ARTICLES = [
  {
    path: '/guide/gift-roadmap',
    title: '0세부터 30세까지, 세금 없이 1억 4천 물려주는 로드맵',
    summary: '0세부터 30세까지 10년 주기 공제를 활용하는 시기별 실행 로드맵을 정리했습니다.',
  },
  {
    path: '/guide/late-report-checklist',
    title: '아이 계좌에 이미 돈이 쌓여 있나요? — 늦은 증여 신고 자가진단',
    summary: '원금 합계 계산부터 한도 비교와 기한 후 신고까지, 지금 확인할 자가진단 3단계를 정리했습니다.',
  },
  {
    path: '/guide/tax-free-money',
    title: '세뱃돈·용돈·아동수당은 증여인가요? — 비과세의 경계',
    summary: '세뱃돈과 용돈의 비과세 경계, 아동수당·부모급여를 분리해 관리하는 원칙을 정리했습니다.',
  },
  {
    path: '/guide/no-report-risks',
    title: '증여세 신고 안 하면 어떻게 되나요? — 가산세와 자금출처조사',
    summary: '신고를 미루면 붙는 가산세와 자금출처 소명, 지금이라도 기한 후 신고로 바로잡는 방법을 정리했습니다.',
  },
  {
    path: '/guide/gift-deduction-limits',
    title: '세금 없이 줄 수 있는 금액은? 증여재산공제 한도 총정리',
    summary: '배우자부터 자녀·손주·사위·며느리까지, 관계별 공제 한도와 10년 합산 규칙을 표로 정리했습니다.',
  },
  {
    path: '/guide/minor-stock-account',
    title: '미성년 자녀 주식계좌 만들기 — 서류부터 증여 신고까지',
    summary: '필요한 서류부터 비대면 계좌 개설, 증여세 신고와 주식 매수 순서까지 한 번에 정리했습니다.',
  },
  {
    path: '/guide/annuity-gift-report',
    title: '자녀에게 매달 증여하고 세금 0원 만들기 — 유기정기금 증여 신고 가이드',
    summary:
      '유기정기금 증여가 무엇인지, 왜 절세가 되는지, 계약서 준비부터 홈택스 신고까지 전체 흐름을 한 번에 정리했습니다.',
  },
  {
    path: '/guide/loan-vs-gift',
    title: '부모 자식 간 돈 거래, 빌린 걸까 증여일까 — 차용증 vs 증여계약서',
    summary: '가족 간 돈 거래를 차용으로 인정받는 조건과 무이자 대여 기준, 증여가 나은 경우를 정리했습니다.',
  },
  {
    path: '/guide/grandparent-gift',
    title: '할머니가 손주에게 주는 돈, 세금이 더 붙나요? — 세대생략 할증',
    summary: '조부모 증여의 공제 합산과 세대생략 할증이 실제로 붙는 경우를 정리했습니다.',
  },
  {
    path: '/guide/spouse-gift',
    title: '부부 사이에도 증여세가 있나요? — 배우자 공제 6억의 활용',
    summary: '생활비 이체와 자산 이전의 차이, 배우자 공제 6억 원의 활용과 주의점을 정리했습니다.',
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
