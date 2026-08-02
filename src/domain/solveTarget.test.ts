import { describe, expect, it } from 'vitest';
import { simulate, type ProductType, type SimulateInput } from './simulate';
import { solveTargetAmount, type SolveTargetInput } from './solveTarget';

const productTypes: ProductType[] = [
  'domesticEquityEtf', 'domesticForeignEtf', 'overseasEtf',
];

const annuityInput: SolveTargetInput = {
  giftMethod: 'annuity',
  startDate: '2026-01-01',
  endDate: '2035-12-31',
  paymentDay: 1,
  childBirthDate: '2021-01-01',
  domesticGrowthRate: 0.05,
  overseasGrowthRate: 0.05,
  distributionRate: 0.02,
  withdrawalAge: 19,
};

const forwardInput = (input: SolveTargetInput, amount: number): SimulateInput => ({
  ...input,
  [input.giftMethod === 'annuity' ? 'monthlyAmount' : 'lumpSumAmount']: amount,
});

describe('solveTargetAmount', () => {
  it.each(productTypes)('%s 역산 금액으로 정방향 계산하면 목표에 모자라지 않는다', (productType) => {
    const target = 100_000_000;
    const result = solveTargetAmount(annuityInput, productType, target);

    expect(result.requiredAmount).not.toBeNull();
    const forward = simulate(forwardInput(annuityInput, result.requiredAmount!));
    expect(forward.byProduct[productType].afterTax).toBeGreaterThanOrEqual(target);
    expect(result.simulated).toEqual(forward);
  });

  it('목표가 커지면 필요 금액도 커진다', () => {
    const smaller = solveTargetAmount(annuityInput, 'domesticEquityEtf', 50_000_000);
    const larger = solveTargetAmount(annuityInput, 'domesticEquityEtf', 100_000_000);

    expect(larger.requiredAmount!).toBeGreaterThan(smaller.requiredAmount!);
  });

  it('상품별 세금 차이가 있으면 필요 금액이 모두 같지는 않다', () => {
    const amounts = productTypes.map((type) =>
      solveTargetAmount(annuityInput, type, 100_000_000).requiredAmount);

    expect(new Set(amounts).size).toBeGreaterThan(1);
  });

  it('상한 금액으로도 목표에 도달할 수 없으면 null을 반환한다', () => {
    const result = solveTargetAmount(
      { ...annuityInput, domesticGrowthRate: -0.2 },
      'domesticEquityEtf',
      1_000_000_000_000,
    );

    expect(result).toEqual({ requiredAmount: null, simulated: null });
  });

  it('일시금 방식도 목표 금액을 역산한다', () => {
    const input: SolveTargetInput = {
      giftMethod: 'lumpSum',
      giftDate: '2026-01-01',
      childBirthDate: '2021-01-01',
      domesticGrowthRate: 0.05,
      overseasGrowthRate: 0.05,
      distributionRate: 0.02,
      withdrawalAge: 19,
    };
    const target = 100_000_000;
    const result = solveTargetAmount(input, 'overseasEtf', target);

    expect(result.requiredAmount).not.toBeNull();
    expect(result.simulated!.byProduct.overseasEtf.afterTax).toBeGreaterThanOrEqual(target);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('유효하지 않은 목표 %s는 null을 반환한다', (target) => {
    expect(solveTargetAmount(annuityInput, 'domesticEquityEtf', target))
      .toEqual({ requiredAmount: null, simulated: null });
  });

  it('시뮬레이터 입력 검증에 실패하면 탐색하지 않고 null을 반환한다', () => {
    expect(solveTargetAmount(
      { ...annuityInput, childBirthDate: '' },
      'domesticEquityEtf',
      100_000_000,
    )).toEqual({ requiredAmount: null, simulated: null });
  });
});
