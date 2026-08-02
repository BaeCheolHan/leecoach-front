import { describe, expect, it } from 'vitest';
import {
  DOMESTIC_FOREIGN_ETF_GAIN_TAX_RATE,
  FINANCIAL_INCOME_THRESHOLD,
  OVERSEAS_ETF_BASIC_DEDUCTION,
  OVERSEAS_ETF_GAIN_TAX_RATE,
} from '../config';
import { simulate, validateSimulateInput, type SimulateInput } from './simulate';

const lumpSumInput = (overrides: Partial<SimulateInput> = {}): SimulateInput => ({
  giftMethod: 'lumpSum',
  lumpSumAmount: 10_000_000,
  giftDate: '2026-01-01',
  childBirthDate: '2025-01-01',
  priceGrowthRate: 0.05,
  distributionRate: 0.02,
  withdrawalAge: 2,
  ...overrides,
});

const annuityInput = (overrides: Partial<SimulateInput> = {}): SimulateInput => ({
  giftMethod: 'annuity',
  monthlyAmount: 100_000,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  paymentDay: 1,
  childBirthDate: '2025-01-01',
  priceGrowthRate: 0.05,
  distributionRate: 0.02,
  withdrawalAge: 2,
  ...overrides,
});

describe('simulate', () => {
  it('일시금의 원금과 평가액을 같은 금액으로 운용한다', () => {
    const result = simulate(lumpSumInput());

    expect(result.giftPrincipal).toBe(10_000_000);
    expect(result.giftValuation).toBe(10_000_000);
    expect(result.withdrawalYear).toBe(2027);
    expect(result.byProduct.domesticEquityEtf.finalValue).toBeGreaterThan(result.giftPrincipal);
  });

  it('유기정기금의 실제 납입 원금과 할인 평가액을 구분한다', () => {
    const result = simulate(annuityInput({ endDate: '2027-12-31', withdrawalAge: 3 }));

    expect(result.giftPrincipal).toBe(2_400_000);
    expect(result.giftValuation).toBeLessThan(result.giftPrincipal);
    expect(result.byProduct.domesticEquityEtf.costBasis).toBeGreaterThan(result.giftPrincipal);
  });

  it('국내주식형 ETF의 매도세금은 항상 0이다', () => {
    expect(simulate(lumpSumInput({ priceGrowthRate: 1 })).byProduct.domesticEquityEtf.saleTax).toBe(0);
  });

  it('해외 ETF 차익이 기본공제 미만이거나 정확히 같으면 매도세금이 0이다', () => {
    const amount = 10_000_000;
    const below = simulate(lumpSumInput({
      lumpSumAmount: amount,
      distributionRate: 0,
      priceGrowthRate: (OVERSEAS_ETF_BASIC_DEDUCTION - 1) / amount,
    }));
    const atBoundary = simulate(lumpSumInput({
      lumpSumAmount: amount,
      distributionRate: 0,
      priceGrowthRate: OVERSEAS_ETF_BASIC_DEDUCTION / amount,
    }));

    expect(below.byProduct.overseasEtf.saleTax).toBe(0);
    expect(atBoundary.byProduct.overseasEtf.capitalGain).toBe(OVERSEAS_ETF_BASIC_DEDUCTION);
    expect(atBoundary.byProduct.overseasEtf.saleTax).toBe(0);
  });

  it('해외 ETF는 기본공제 초과분에만 과세한다', () => {
    const amount = 10_000_000;
    const excess = 1_000_000;
    const result = simulate(lumpSumInput({
      lumpSumAmount: amount,
      distributionRate: 0,
      priceGrowthRate: (OVERSEAS_ETF_BASIC_DEDUCTION + excess) / amount,
    }));

    expect(result.byProduct.overseasEtf.saleTax)
      .toBe(Math.round(excess * OVERSEAS_ETF_GAIN_TAX_RATE));
  });

  it('가격 하락으로 차익이 음수이면 모든 상품의 매도세금이 0이다', () => {
    const input = lumpSumInput({ priceGrowthRate: -0.1, distributionRate: 0 });

    expect(validateSimulateInput(input)).toEqual([]);

    const result = simulate(input);
    expect(Object.values(result.byProduct).every(product => product.capitalGain < 0)).toBe(true);
    expect(Object.values(result.byProduct).every(product => product.saleTax === 0)).toBe(true);
    // 손실이 세후 금액에 그대로 반영된다 — 원금보다 적게 남는다.
    expect(Object.values(result.byProduct).every(p => p.afterTax < result.giftPrincipal)).toBe(true);
  });

  it('분배율이 0이면 분배금 세금이 없고 세 상품의 최종가치가 같다', () => {
    const result = simulate(lumpSumInput({ distributionRate: 0 }));
    const products = Object.values(result.byProduct);

    expect(products.every(product => product.distributionTax === 0)).toBe(true);
    expect(new Set(products.map(product => product.finalValue)).size).toBe(1);
  });

  it('공제 한도 이내이면 증여세 납부액이 0이다', () => {
    expect(simulate(lumpSumInput()).giftTax.payable).toBe(0);
  });

  it('여러 해 분배금을 합산해 종합과세를 경고하지 않는다', () => {
    // 20년간 소액 분배금이 쌓여 누적으로는 기준을 넘지만, 어느 해에도 연간 기준을 넘지 않는다.
    const result = simulate(lumpSumInput({
      lumpSumAmount: 100_000_000,
      priceGrowthRate: 0,
      distributionRate: 0.01,
      withdrawalAge: 21,
    }));

    expect(result.byProduct.domesticForeignEtf.capitalGain)
      .toBeLessThanOrEqual(FINANCIAL_INCOME_THRESHOLD);
    expect(result.financialIncomeWarning).toBe(false);
  });

  it('한 해 분배금이 기준을 넘으면 종합과세를 경고한다', () => {
    const result = simulate(lumpSumInput({
      lumpSumAmount: 3_000_000_000,
      priceGrowthRate: 0,
      distributionRate: 0.05,
    }));

    expect(result.financialIncomeWarning).toBe(true);
  });

  it('국내 상장 해외 ETF의 양도차익에는 설정 세율을 적용한다', () => {
    const result = simulate(lumpSumInput({ distributionRate: 0 }));
    const gain = result.byProduct.domesticForeignEtf.capitalGain;

    expect(result.byProduct.domesticForeignEtf.saleTax)
      .toBe(Math.round(gain * DOMESTIC_FOREIGN_ETF_GAIN_TAX_RATE));
  });
});

describe('validateSimulateInput', () => {
  it('인출 연도 직전 해 말에 증여가 끝나는 경계는 허용한다', () => {
    expect(validateSimulateInput(annuityInput())).toEqual([]);
  });

  it('인출 시점이 증여 종료 전이면 오류를 반환한다', () => {
    expect(validateSimulateInput(annuityInput({ endDate: '2027-12-31' })))
      .toContain('인출 시점은 증여가 끝난 뒤여야 합니다');
  });

  it('방식별 필수값 누락과 음수 금액을 검증한다', () => {
    expect(validateSimulateInput(lumpSumInput({ lumpSumAmount: -1, giftDate: undefined }))).not.toEqual([]);
    expect(validateSimulateInput(annuityInput({ monthlyAmount: undefined, paymentDay: undefined }))).not.toEqual([]);
  });

  it('손실 시나리오를 위해 마이너스 가격상승률을 허용한다', () => {
    expect(validateSimulateInput(lumpSumInput({ priceGrowthRate: -0.01 }))).toEqual([]);
    expect(validateSimulateInput(lumpSumInput({ priceGrowthRate: -1 }))).toEqual([]);
  });

  it('가격상승률이 -100% 미만이거나 100% 초과이면 오류를 반환한다', () => {
    expect(validateSimulateInput(lumpSumInput({ priceGrowthRate: -1.01 }))).not.toEqual([]);
    expect(validateSimulateInput(lumpSumInput({ priceGrowthRate: 1.01 }))).not.toEqual([]);
  });

  it('분배율은 음수이거나 100% 초과이면 오류를 반환한다', () => {
    expect(validateSimulateInput(lumpSumInput({ distributionRate: -0.01 }))).not.toEqual([]);
    expect(validateSimulateInput(lumpSumInput({ distributionRate: 1.01 }))).not.toEqual([]);
  });
});
