import {
  simulate,
  validateSimulateInput,
  type ProductType,
  type SimulateInput,
} from './simulate';

/** 역산 입력 — 증여액만 빠진 SimulateInput */
export type SolveTargetInput = Omit<SimulateInput, 'monthlyAmount' | 'lumpSumAmount'>;

export interface SolveTargetResult {
  /** 목표를 채우는 데 필요한 금액. 유기정기금이면 월 지급액, 일시금이면 증여 총액. 도달 불가면 null */
  requiredAmount: number | null;
  /** requiredAmount로 다시 계산한 실제 결과 — 화면에 증여세·평가액을 함께 보여주기 위함 */
  simulated: ReturnType<typeof simulate> | null;
}

const UPPER_BOUND = 1_000_000_000;
const SEARCH_ITERATIONS = 60;

/** 증여 방식에 맞는 금액 필드에 후보값을 넣어 정방향 계산 입력을 만든다. */
function withAmount(input: SolveTargetInput, amount: number): SimulateInput {
  return {
    ...input,
    [input.giftMethod === 'annuity' ? 'monthlyAmount' : 'lumpSumAmount']: amount,
  };
}

/** 상품별 목표 세후 금액을 채우는 최소 증여액을 정방향 계산의 이분 탐색으로 구한다. */
export function solveTargetAmount(
  input: SolveTargetInput,
  productType: ProductType,
  targetAfterTax: number,
): SolveTargetResult {
  const empty = { requiredAmount: null, simulated: null };
  if (!Number.isFinite(targetAfterTax) || targetAfterTax <= 0) return empty;
  if (validateSimulateInput(withAmount(input, 0)).length > 0) return empty;

  const upperResult = simulate(withAmount(input, UPPER_BOUND));
  if (upperResult.byProduct[productType].afterTax < targetAfterTax) return empty;

  let lower = 0;
  let upper = UPPER_BOUND;
  for (let iteration = 0; iteration < SEARCH_ITERATIONS; iteration++) {
    const candidate = (lower + upper) / 2;
    const result = simulate(withAmount(input, candidate));
    if (result.byProduct[productType].afterTax >= targetAfterTax) upper = candidate;
    else lower = candidate;
  }

  const requiredAmount = Math.ceil(upper);
  return {
    requiredAmount,
    simulated: simulate(withAmount(input, requiredAmount)),
  };
}
