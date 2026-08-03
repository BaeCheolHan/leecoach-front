import { describe, expect, it } from 'vitest';
import { FILING_TAX_CREDIT_RATE, GIFT_TAX_BRACKETS } from '../config';
import type { DeductionJudgement } from './giftTax';
import { giftTaxAmount } from './giftTaxAmount';

const judgement = (excess: number, overrides: Partial<DeductionJudgement> = {}): DeductionJudgement => ({
  limit: 20_000_000,
  available: 20_000_000,
  within: false,
  excess,
  minorApplied: true,
  underTaxMin: false,
  ...overrides,
});

describe('giftTaxAmount', () => {
  it('공제 한도 이내이면 모든 세액이 0이다', () => {
    expect(giftTaxAmount(judgement(0, { within: true }))).toEqual({
      taxBase: 0, calculated: 0, filingCredit: 0, payable: 0,
    });
  });

  it('과세최저한 미만이면 모든 세액이 0이다', () => {
    expect(giftTaxAmount(judgement(499_999, { underTaxMin: true }))).toEqual({
      taxBase: 0, calculated: 0, filingCredit: 0, payable: 0,
    });
  });

  it.each(GIFT_TAX_BRACKETS.slice(0, -1).map((bracket, index) => [
    bracket.limit,
    bracket,
    GIFT_TAX_BRACKETS[index + 1],
  ] as const))('구간 경계 %d원은 해당 구간에 포함되고 다음 1원은 다음 구간이다', (limit, at, next) => {
    const atBoundary = giftTaxAmount(judgement(limit));
    const aboveBoundary = giftTaxAmount(judgement(limit + 1));

    const atCalculated = limit * at.rate - at.deduction;
    const aboveCalculated = (limit + 1) * next.rate - next.deduction;
    expect(atBoundary).toEqual({
      taxBase: limit,
      calculated: Math.round(atCalculated),
      filingCredit: Math.round(atCalculated * FILING_TAX_CREDIT_RATE),
      payable: Math.round(atCalculated * (1 - FILING_TAX_CREDIT_RATE)),
    });
    expect(aboveBoundary.calculated).toBe(Math.round(aboveCalculated));
  });

  it('마지막 구간은 최고 세율과 누진공제를 적용한다', () => {
    const taxBase = 4_000_000_000;
    const bracket = GIFT_TAX_BRACKETS.at(-1)!;
    const calculated = taxBase * bracket.rate - bracket.deduction;

    expect(giftTaxAmount(judgement(taxBase))).toEqual({
      taxBase,
      calculated: Math.round(calculated),
      filingCredit: Math.round(calculated * FILING_TAX_CREDIT_RATE),
      payable: Math.round(calculated * (1 - FILING_TAX_CREDIT_RATE)),
    });
  });
});
