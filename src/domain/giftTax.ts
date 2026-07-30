export type Relation = '부' | '모' | '자' | '손' | '조부' | '조모' | '배우자' | '기타';

export interface DeductionJudgement {
  limit: number;
  within: boolean;
  excess: number;
  minorApplied: boolean;
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

export function judgeDeduction(
  totalDiscounted: number, relation: Relation, minor: boolean,
): DeductionJudgement {
  const limit = deductionLimit(relation, minor);
  const within = totalDiscounted <= limit;
  return {
    limit,
    within,
    excess: within ? 0 : totalDiscounted - limit,
    minorApplied: minor && (relation === '자' || relation === '손'),
  };
}
