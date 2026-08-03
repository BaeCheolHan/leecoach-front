import { describe, expect, it } from 'vitest';
import { evaluateAnnuity } from './annuity';
import { maxAnnuityMonthlyWithinLimit } from './limitPlanner';

const schedule = { startDate: '2026-09-01', endDate: '2036-08-31', paymentDay: 1 };
const valuation = (monthlyAmount: number) =>
  evaluateAnnuity({ ...schedule, monthlyAmount }).totalDiscounted;

describe('maxAnnuityMonthlyWithinLimit', () => {
  it('결과 월액은 한도 이내이고, 1원만 더 주면 한도를 넘는 경계값이다', () => {
    const limit = 20_000_000;
    const max = maxAnnuityMonthlyWithinLimit(schedule, limit);

    expect(max).toBeGreaterThan(0);
    expect(valuation(max)).toBeLessThanOrEqual(limit);
    expect(valuation(max + 1)).toBeGreaterThan(limit);
  });

  it('남은 한도가 0이면 0', () => {
    expect(maxAnnuityMonthlyWithinLimit(schedule, 0)).toBe(0);
  });

  it('남은 한도가 음수·NaN이어도 0', () => {
    expect(maxAnnuityMonthlyWithinLimit(schedule, -1)).toBe(0);
    expect(maxAnnuityMonthlyWithinLimit(schedule, Number.NaN)).toBe(0);
  });

  it('기간이 1년이어도 경계가 성립한다', () => {
    const oneYear = { startDate: '2026-09-01', endDate: '2027-08-31', paymentDay: 1 };
    const max = maxAnnuityMonthlyWithinLimit(oneYear, 20_000_000);
    const value = (m: number) => evaluateAnnuity({ ...oneYear, monthlyAmount: m }).totalDiscounted;

    expect(value(max)).toBeLessThanOrEqual(20_000_000);
    expect(value(max + 1)).toBeGreaterThan(20_000_000);
  });

  it('첫 역년에 지급이 없어 전액 할인되는 스케줄에서도 경계가 성립한다', () => {
    const discounted = { startDate: '2026-12-31', endDate: '2027-01-31', paymentDay: 1 };
    const max = maxAnnuityMonthlyWithinLimit(discounted, 20_000_000);
    const value = (m: number) => evaluateAnnuity({ ...discounted, monthlyAmount: m }).totalDiscounted;

    expect(value(max)).toBeLessThanOrEqual(20_000_000);
    expect(value(max + 1)).toBeGreaterThan(20_000_000);
  });
});
