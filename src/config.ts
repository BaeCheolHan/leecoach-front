/** 상증세법 시행규칙이 정하는 정기금 평가 이자율 (연 1000분의 30). 개정 이력이 있으므로 반드시 이 상수로만 참조한다. */
export const DISCOUNT_RATE = 0.03;
/** 유기정기금 평가액 상한: 1년분 정기금액의 20배 (상증세법 시행령 §62 1호 단서) */
export const CAP_MULTIPLIER = 20;
/** 성년 기준 나이 (만 나이) */
export const ADULT_AGE = 19;
/** 증여세 과세최저한: 과세표준이 이 금액 미만이면 부과하지 않음 (상증세법 §55②) */
export const TAX_MIN_THRESHOLD = 500_000;
/** 운영 도메인 (canonical·JSON-LD 용) */
export const SITE_ORIGIN = 'https://leecoachmom.com';
/** 면책 문구 — 화면·PDF 공통 */
export const DISCLAIMER =
  '본 자료는 서식 작성을 돕는 참고 자료이며 세무 자문이 아닙니다. 증여세 신고의 책임은 납세자 본인에게 있으므로 신고 전 세무사 등 전문가의 검토를 받으시기 바랍니다.';
