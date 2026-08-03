import { TAX_MIN_THRESHOLD } from '../config';

export type Relation = '부' | '모' | '자' | '손' | '조부' | '조모' | '배우자' | '기타';

export interface DeductionJudgement {
  limit: number;
  /** 기존 증여(10년 통산)를 차감하고 이번 증여에 실제로 쓸 수 있는 한도 */
  available: number;
  within: boolean;
  excess: number;
  minorApplied: boolean;
  /** 한도는 초과했지만 과세표준(초과액)이 과세최저한 미만이라 증여세가 부과되지 않는 경우 */
  underTaxMin: boolean;
  /**
   * 기존 증여가 공제 한도를 넘은 경우. 이때는 법정 계산이 과세가액 합산(§47②) +
   * 기납부세액공제 구조로 가는데, 기존 증여의 신고 여부와 납부세액을 알 수 없어
   * 정확한 세액을 낼 수 없다. 금액 대신 안내로 대체해야 한다.
   */
  priorExceedsLimit: boolean;
}

/**
 * 증여재산공제 한도 (10년 통산). relation은 "수증자는 증여자의 ___" 관점.
 * 자·손: 직계존속으로부터 받는 직계비속 → 미성년 2천만 / 성년 5천만.
 * 부·모·조부·조모: 직계비속으로부터 받는 직계존속 → 5천만.
 */
export function deductionLimit(relation: Relation, minor: boolean): number {
  switch (relation) {
    case '자':
    case '손':
      return minor ? 20_000_000 : 50_000_000;
    case '부':
    case '모':
    case '조부':
    case '조모':
      return 50_000_000;
    case '배우자':
      return 600_000_000;
    case '기타':
      return 10_000_000;
  }
}

/**
 * priorGifts: 최근 10년 내 증여자로부터 받은 다른 증여액(상증세법 §53의 공제 한도 통산).
 * 증여자가 직계존속이면 그 배우자를 포함한다(§47②) — 아버지·어머니 증여는 하나로 합산한다.
 * 한도 차감까지만 반영한다 — 과세가액 합산(§47②)과 기납부세액공제는 다루지 않는다.
 * 기존 증여가 한도를 넘으면(priorExceedsLimit) 법정 계산이 합산·기납부세액공제 구조로
 * 넘어가 신고 여부·납부세액을 모르는 채로는 세액을 정확히 낼 수 없다.
 */
export function judgeDeduction(
  totalDiscounted: number, relation: Relation, minor: boolean, priorGifts = 0,
): DeductionJudgement {
  const limit = deductionLimit(relation, minor);
  const available = Math.max(0, limit - priorGifts);
  const within = totalDiscounted <= available;
  const excess = within ? 0 : totalDiscounted - available;
  return {
    limit,
    available,
    within,
    excess,
    minorApplied: minor && (relation === '자' || relation === '손'),
    underTaxMin: !within && excess < TAX_MIN_THRESHOLD,
    priorExceedsLimit: priorGifts > limit,
  };
}
