import {
  DIVIDEND_TAX_RATE,
  DOMESTIC_FOREIGN_ETF_GAIN_TAX_RATE,
  FINANCIAL_INCOME_THRESHOLD,
  OVERSEAS_DIVIDEND_WITHHOLDING_RATE,
  OVERSEAS_ETF_BASIC_DEDUCTION,
  OVERSEAS_ETF_GAIN_TAX_RATE,
} from '../config';
import { isMinor } from './age';
import { evaluateAnnuity } from './annuity';
import { judgeDeduction, type DeductionJudgement } from './giftTax';
import { giftTaxAmount, type GiftTaxResult } from './giftTaxAmount';

export type ProductType = 'domesticEquityEtf' | 'domesticForeignEtf' | 'overseasEtf';

export interface SimulateInput {
  giftMethod: 'annuity' | 'lumpSum';
  monthlyAmount?: number;
  startDate?: string;
  endDate?: string;
  paymentDay?: number;
  lumpSumAmount?: number;
  giftDate?: string;
  childBirthDate: string;
  /** 최근 10년 내 같은 증여자에게 받은 다른 증여액 — 공제 한도에서 차감 (미입력 시 0) */
  priorGifts?: number;
  /** 국내 주식형 ETF에 적용할 연 가격상승률 */
  domesticGrowthRate: number;
  /** 해외 지수를 추종하는 ETF에 적용할 연 가격상승률 (국내 상장·해외 상장 공통) */
  overseasGrowthRate: number;
  distributionRate: number;
  withdrawalAge: number;
}

export interface ProductResult {
  finalValue: number;
  costBasis: number;
  capitalGain: number;
  distributionTax: number;
  saleTax: number;
  afterTax: number;
}

export interface SimulateResult {
  giftPrincipal: number;
  giftValuation: number;
  deduction: DeductionJudgement;
  giftTax: GiftTaxResult;
  withdrawalYear: number;
  byProduct: Record<ProductType, ProductResult>;
  financialIncomeWarning: boolean;
}

interface RawProductResult extends ProductResult {
  /** 금융소득 종합과세는 연간 기준이므로 누적이 아니라 연간 최대 분배금을 본다. */
  maxAnnualDistribution: number;
}

const productTypes: ProductType[] = [
  'domesticEquityEtf', 'domesticForeignEtf', 'overseasEtf',
];

const distributionTaxRate: Record<ProductType, number> = {
  domesticEquityEtf: DIVIDEND_TAX_RATE,
  domesticForeignEtf: DIVIDEND_TAX_RATE,
  overseasEtf: OVERSEAS_DIVIDEND_WITHHOLDING_RATE,
};

const isPresent = (value: unknown) => value !== undefined && value !== null && value !== '';
const isNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** 시뮬레이터 입력의 필수값, 범위, 증여 종료와 인출 시점 순서를 검증한다. */
/** 수익률 입력 허용 폭(±30%). 참고 표에 싣는 값을 그대로 받을 수 있어야 한다. */
const GROWTH_RATE_LIMIT = 0.3;

export function validateSimulateInput(input: SimulateInput): string[] {
  const errors: string[] = [];

  if (!input.childBirthDate) errors.push('자녀 생년월일은 필수입니다');
  if (!isNonNegative(input.withdrawalAge)) errors.push('인출 나이를 확인해 주세요');
  // 손실 시나리오도 계산할 수 있어야 하므로 음수를 허용한다. 상한이 ±20%였을 때는
  // 참고 표의 나스닥 최근 10년(22.1%)을 '적용'하면 곧바로 오류가 나는 모순이 있었다.
  // 실제로 제시하는 참고값을 받아들일 수 있어야 한다.
  if (!isFiniteNumber(input.domesticGrowthRate)
    || input.domesticGrowthRate < -GROWTH_RATE_LIMIT || input.domesticGrowthRate > GROWTH_RATE_LIMIT) {
    errors.push('국내 수익률은 -30% 이상 30% 이하여야 합니다');
  }
  if (!isFiniteNumber(input.overseasGrowthRate)
    || input.overseasGrowthRate < -GROWTH_RATE_LIMIT || input.overseasGrowthRate > GROWTH_RATE_LIMIT) {
    errors.push('해외 수익률은 -30% 이상 30% 이하여야 합니다');
  }
  if (!isNonNegative(input.distributionRate) || input.distributionRate > 1) {
    errors.push('분배율은 0% 이상 100% 이하여야 합니다');
  }
  if (input.priorGifts !== undefined && !isNonNegative(input.priorGifts)) {
    errors.push('기존 증여액은 0 이상이어야 합니다');
  }

  let giftEndDate: string | undefined;
  if (input.giftMethod === 'annuity') {
    if (!isPresent(input.startDate)) errors.push('증여 시작일은 필수입니다');
    if (!isPresent(input.endDate)) errors.push('증여 종료일은 필수입니다');
    if (!isNonNegative(input.monthlyAmount)) errors.push('월 지급액은 0 이상이어야 합니다');
    if (!Number.isInteger(input.paymentDay) || input.paymentDay! < 1 || input.paymentDay! > 31) {
      errors.push('지급일은 1일부터 31일 사이여야 합니다');
    }
    if (input.startDate && input.endDate && input.startDate > input.endDate) {
      errors.push('증여 종료일은 시작일 이후여야 합니다');
    }
    giftEndDate = input.endDate;
  } else {
    if (!isPresent(input.giftDate)) errors.push('증여일은 필수입니다');
    if (!isNonNegative(input.lumpSumAmount)) errors.push('증여 금액은 0 이상이어야 합니다');
    giftEndDate = input.giftDate;
  }

  // 증여가 끝나는 해에 인출하는 것은 정상이다("10살에 시작해 10년 주고 20살에 찾는다").
  // 그보다 앞서 찾는 것만 막는다 — 지급이 남은 상태의 인출은 유기정기금 계약과 충돌한다.
  if (input.childBirthDate && isNonNegative(input.withdrawalAge) && giftEndDate) {
    const withdrawalYear = Number(input.childBirthDate.slice(0, 4)) + input.withdrawalAge;
    if (withdrawalYear < Number(giftEndDate.slice(0, 4))) {
      errors.push('인출 시점은 증여가 끝난 뒤여야 합니다');
    }
  }

  return errors;
}

/** 증여 원금의 연도별 납입과 상품별 분배·성장·매도세금을 계산한다. */
export function simulate(input: SimulateInput): SimulateResult {
  const withdrawalYear = Number(input.childBirthDate.slice(0, 4)) + input.withdrawalAge;
  let giftPrincipal: number;
  let giftValuation: number;
  let giftStartDate: string;
  let contributions: Map<number, number>;

  if (input.giftMethod === 'annuity') {
    const annuity = evaluateAnnuity({
      startDate: input.startDate!,
      endDate: input.endDate!,
      paymentDay: input.paymentDay!,
      monthlyAmount: input.monthlyAmount!,
    });
    giftPrincipal = annuity.totalPrincipal;
    giftValuation = annuity.totalDiscounted;
    giftStartDate = input.startDate!;
    contributions = new Map(annuity.rows.map(row => [row.year, row.principal]));
  } else {
    giftPrincipal = input.lumpSumAmount!;
    giftValuation = giftPrincipal;
    giftStartDate = input.giftDate!;
    contributions = new Map([[Number(giftStartDate.slice(0, 4)), giftPrincipal]]);
  }

  const minor = isMinor(input.childBirthDate, giftStartDate);
  const deduction = judgeDeduction(giftValuation, '자', minor, input.priorGifts ?? 0);
  const rawProducts = {} as Record<ProductType, RawProductResult>;
  const startYear = Number(giftStartDate.slice(0, 4));
  const endYear = Math.max(...contributions.keys());

  for (const productType of productTypes) {
    const growthRate = productType === 'domesticEquityEtf'
      ? input.domesticGrowthRate
      : input.overseasGrowthRate;
    let balance = 0;
    let costBasis = 0;
    let distributionTax = 0;
    let maxAnnualDistribution = 0;

    // 납입 기간과 성장 기간을 분리한다. 하나로 묶으면 인출 연도가 증여 종료 연도와 같을 때
    // 마지막 해 납입이 통째로 누락되어, 인출 시점을 항상 1년 뒤로 미뤄야 했다.
    const lastYear = Math.max(endYear, withdrawalYear - 1);
    for (let year = startYear; year <= lastYear; year++) {
      const contribution = contributions.get(year) ?? 0;
      balance += contribution;
      costBasis += contribution;

      // 인출하는 해에는 분배·성장이 일어나지 않는다 (연초에 매도한다고 본다).
      if (year >= withdrawalYear) continue;

      const distribution = balance * input.distributionRate;
      const distTax = distribution * distributionTaxRate[productType];
      maxAnnualDistribution = Math.max(maxAnnualDistribution, distribution);
      distributionTax += distTax;
      balance += distribution - distTax;
      costBasis += distribution - distTax;
      balance *= 1 + growthRate;
    }

    const capitalGain = balance - costBasis;
    let saleTax = 0;
    if (productType === 'domesticForeignEtf') {
      saleTax = Math.max(0, capitalGain) * DOMESTIC_FOREIGN_ETF_GAIN_TAX_RATE;
    } else if (productType === 'overseasEtf') {
      saleTax = Math.max(0, capitalGain - OVERSEAS_ETF_BASIC_DEDUCTION)
        * OVERSEAS_ETF_GAIN_TAX_RATE;
    }

    rawProducts[productType] = {
      finalValue: balance,
      costBasis,
      capitalGain,
      distributionTax,
      saleTax,
      afterTax: balance - saleTax,
      maxAnnualDistribution,
    };
  }

  const domesticForeign = rawProducts.domesticForeignEtf;
  const byProduct = Object.fromEntries(productTypes.map(productType => {
    const { maxAnnualDistribution: _, ...product } = rawProducts[productType];
    return [productType, Object.fromEntries(
      Object.entries(product).map(([key, value]) => [key, Math.round(value)]),
    )];
  })) as unknown as Record<ProductType, ProductResult>;

  // 종합과세는 연간 소득 기준이므로 여러 해 소득을 합산하지 않는다. 매도 연도에는 분배금이 없고
  // 매도차익만 발생하며, 해외 상장 ETF 차익은 양도소득으로 분류과세되어 금융소득에서 제외된다.
  const maxAnnualDistribution = Math.max(
    ...productTypes.map(productType => rawProducts[productType].maxAnnualDistribution),
  );

  return {
    giftPrincipal: Math.round(giftPrincipal),
    giftValuation: Math.round(giftValuation),
    deduction,
    giftTax: giftTaxAmount(deduction),
    withdrawalYear,
    byProduct,
    financialIncomeWarning:
      domesticForeign.capitalGain > FINANCIAL_INCOME_THRESHOLD
      || maxAnnualDistribution > FINANCIAL_INCOME_THRESHOLD,
  };
}
