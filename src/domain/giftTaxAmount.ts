import { FILING_TAX_CREDIT_RATE, GIFT_TAX_BRACKETS } from '../config';
import type { DeductionJudgement } from './giftTax';

export interface GiftTaxResult {
  taxBase: number;
  calculated: number;
  filingCredit: number;
  payable: number;
}

/** 공제 판정의 과세표준에 증여세 누진세율과 신고세액공제를 적용한다. */
export function giftTaxAmount(judgement: DeductionJudgement): GiftTaxResult {
  if (judgement.within || judgement.underTaxMin) {
    return { taxBase: 0, calculated: 0, filingCredit: 0, payable: 0 };
  }

  const taxBase = judgement.excess;
  const bracket = GIFT_TAX_BRACKETS.find(({ limit }) => taxBase <= limit)!;
  const calculated = taxBase * bracket.rate - bracket.deduction;
  const filingCredit = calculated * FILING_TAX_CREDIT_RATE;

  return {
    taxBase: Math.round(taxBase),
    calculated: Math.round(calculated),
    filingCredit: Math.round(filingCredit),
    payable: Math.round(calculated - filingCredit),
  };
}
