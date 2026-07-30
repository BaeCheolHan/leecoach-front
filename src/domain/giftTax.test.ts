import { describe, it, expect } from 'vitest';
import { deductionLimit, judgeDeduction } from './giftTax';

describe('deductionLimit', () => {
  it('직계존속→직계비속(수증자가 자/손): 미성년 2천만, 성년 5천만', () => {
    expect(deductionLimit('자', true)).toBe(20_000_000);
    expect(deductionLimit('자', false)).toBe(50_000_000);
    expect(deductionLimit('손', true)).toBe(20_000_000);
  });
  it('직계비속→직계존속(수증자가 부/모/조부/조모): 5천만 (미성년 무관)', () => {
    expect(deductionLimit('부', false)).toBe(50_000_000);
    expect(deductionLimit('조모', true)).toBe(50_000_000);
  });
  it('배우자 6억, 기타친족 1천만', () => {
    expect(deductionLimit('배우자', false)).toBe(600_000_000);
    expect(deductionLimit('기타', false)).toBe(10_000_000);
  });
});

describe('judgeDeduction', () => {
  it('한도 이내: 미성년 자녀에게 평가액 1,999만원', () => {
    expect(judgeDeduction(19_990_000, '자', true)).toEqual({
      limit: 20_000_000, within: true, excess: 0, minorApplied: true,
    });
  });
  it('한도 정확히 도달은 이내로 본다', () => {
    expect(judgeDeduction(20_000_000, '자', true).within).toBe(true);
  });
  it('한도 초과: 초과액을 계산한다', () => {
    expect(judgeDeduction(23_000_000, '자', true)).toEqual({
      limit: 20_000_000, within: false, excess: 3_000_000, minorApplied: true,
    });
  });
});
