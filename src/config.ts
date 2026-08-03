/** 상증세법 시행규칙이 정하는 정기금 평가 이자율 (연 1000분의 30). 개정 이력이 있으므로 반드시 이 상수로만 참조한다. */
export const DISCOUNT_RATE = 0.03;
/** 유기정기금 평가액 상한: 1년분 정기금액의 20배 (상증세법 시행령 §62 1호 단서) */
export const CAP_MULTIPLIER = 20;
/** 성년 기준 나이 (만 나이) */
export const ADULT_AGE = 19;
/** 증여세 과세최저한: 과세표준이 이 금액 미만이면 부과하지 않음 (상증세법 §55②) */
export const TAX_MIN_THRESHOLD = 500_000;
/** ── 세무사 검수 대기 (2026-08-02). 확정 전 잠정값 ── */
/** 배당소득 원천징수세율 15.4% (소득세법 §129①2, 지방세법 §103의13) */
export const DIVIDEND_TAX_RATE = 0.154;
/** 국내 상장 해외 ETF 매매차익 배당소득 원천징수세율 15.4% (소득세법 §129①2, 지방세법 §103의13) */
export const DOMESTIC_FOREIGN_ETF_GAIN_TAX_RATE = 0.154;
/** 국외주식 양도소득세율 22% (소득세법 §104①12, 지방세법 §103의3) */
export const OVERSEAS_ETF_GAIN_TAX_RATE = 0.22;
/** 국외주식 양도소득 기본공제 연 250만 원 (소득세법 §103①) */
export const OVERSEAS_ETF_BASIC_DEDUCTION = 2_500_000;
/** 미국 배당소득 원천징수세율 15% (대한민국·미합중국 조세조약 §12②) */
export const OVERSEAS_DIVIDEND_WITHHOLDING_RATE = 0.15;
/** 금융소득 종합과세 기준금액 2천만 원 (소득세법 §14③6) */
export const FINANCIAL_INCOME_THRESHOLD = 20_000_000;
/** 증여세 신고세액공제율 3% (상증세법 §69②) */
export const FILING_TAX_CREDIT_RATE = 0.03;
/** 증여세 과세표준별 세율 및 누진공제액 (상증세법 §26) */
export const GIFT_TAX_BRACKETS = [
  { limit: 100_000_000, rate: 0.1, deduction: 0 },
  { limit: 500_000_000, rate: 0.2, deduction: 10_000_000 },
  { limit: 1_000_000_000, rate: 0.3, deduction: 60_000_000 },
  { limit: 3_000_000_000, rate: 0.4, deduction: 160_000_000 },
  { limit: Infinity, rate: 0.5, deduction: 460_000_000 },
] as const;
/**
 * 지수별 참고 연평균 수익률. 사용자가 "얼마를 넣어야 할지" 모를 때 고르는 출발점이며,
 * 우리가 권하는 값이 아니다. 기간·출처가 제각각이라 행끼리 직접 비교할 수 없다.
 * 최근 급등이 결과를 크게 부풀리므로 '급등 포함'과 '급등 제외'를 함께 싣는다.
 */
export const INDEX_REFERENCE_RETURNS = [
  {
    name: '코스피', scope: 'domestic',
    recent:    { rate: 0.09,  period: '2006~2026', basis: '토탈리턴', source: '지수 레벨로 산출' },
    excluding: { rate: 0.082, period: '2002~2022', basis: '토탈리턴(배당 1.7% 포함)', source: '삼성증권' },
  },
  // '급등 제외' 세트는 기간(2002~2022)·기준(토탈리턴)을 통일 — 코스피만 배당을 얹고
  // 미국 지수는 뺀 채 나란히 보여주면 코스피가 20년간 미국을 이긴 것처럼 오독된다 (2026-08-03).
  {
    name: 'S&P 500', scope: 'overseas',
    recent:    { rate: 0.103, period: '1996~2026.5', basis: '배당 재투자', source: 'dqydj' },
    excluding: { rate: 0.097, period: '2002~2022', basis: '토탈리턴(배당 재투자)', source: 'dqydj' },
  },
  {
    name: '나스닥', scope: 'overseas',
    recent:    { rate: 0.221, period: '2016~2026.6', basis: '토탈리턴', source: 'financecharts' },
    excluding: { rate: 0.119, period: '2002~2022', basis: '토탈리턴(배당 재투자)', source: 'dqydj' },
  },
] as const;
/** 운영 도메인 (canonical·JSON-LD 용) */
export const SITE_ORIGIN = 'https://leecoachmom.com';
/** 면책 문구 — 화면·PDF 공통 */
export const DISCLAIMER =
  '본 자료는 서식 작성을 돕는 참고 자료이며 세무 자문이 아닙니다. 증여세 신고의 책임은 납세자 본인에게 있으므로 신고 전 세무사 등 전문가의 검토를 받으시기 바랍니다.';
