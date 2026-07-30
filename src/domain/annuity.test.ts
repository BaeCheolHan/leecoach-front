import { describe, it, expect } from 'vitest';
import { evaluateAnnuity } from './annuity';

describe('evaluateAnnuity — 참고 사이트 실측 픽스처', () => {
  it('시나리오 1: 2026-01-01~2035-12-31, 매월 1일 10만원', () => {
    const r = evaluateAnnuity({
      startDate: '2026-01-01', endDate: '2035-12-31', paymentDay: 1, monthlyAmount: 100_000,
    });
    const expected = [
      [2026, 1, 12, 1_200_000, 1_200_000],
      [2027, 2, 12, 1_200_000, 1_165_049],
      [2028, 3, 12, 1_200_000, 1_131_115],
      [2029, 4, 12, 1_200_000, 1_098_170],
      [2030, 5, 12, 1_200_000, 1_066_184],
      [2031, 6, 12, 1_200_000, 1_035_131],
      [2032, 7, 12, 1_200_000, 1_004_981],
      [2033, 8, 12, 1_200_000, 975_710],
      [2034, 9, 12, 1_200_000, 947_291],
      [2035, 10, 12, 1_200_000, 919_700],
    ];
    expect(r.rows.map(x => [x.year, x.seq, x.payments, x.principal, x.discounted]))
      .toEqual(expected);
    expect(r.totalPrincipal).toBe(12_000_000);
    expect(r.totalDiscounted).toBe(10_543_331);
    expect(r.capApplied).toBe(false);
  });

  it('시나리오 2: 연중 시작 2026-03-01~2036-02-28 — 역년 절단', () => {
    const r = evaluateAnnuity({
      startDate: '2026-03-01', endDate: '2036-02-28', paymentDay: 1, monthlyAmount: 100_000,
    });
    expect(r.rows[0]).toMatchObject({ year: 2026, payments: 10, principal: 1_000_000, discounted: 1_000_000 });
    expect(r.rows.at(-1)).toMatchObject({ year: 2036, seq: 11, payments: 2, principal: 200_000, discounted: 148_819 });
    expect(r.totalDiscounted).toBe(10_492_149);
  });

  it('지급일 31일은 짧은 달의 말일로 당겨 계산한다', () => {
    // 2026-01-31~2026-04-30, 매월 31일: 1/31, 2/28, 3/31 지급(4/31→4/30도 기간 내), 총 4회
    const r = evaluateAnnuity({
      startDate: '2026-01-31', endDate: '2026-04-30', paymentDay: 31, monthlyAmount: 100_000,
    });
    expect(r.rows[0].payments).toBe(4);
  });

  it('20배 상한이 발동한다', () => {
    // 30년 무할인 아님 — 할인해도 20배 초과하도록 긴 기간
    const r = evaluateAnnuity({
      startDate: '2026-01-01', endDate: '2065-12-31', paymentDay: 1, monthlyAmount: 100_000,
    });
    expect(r.cap).toBe(100_000 * 12 * 20);
    expect(r.sumDiscounted).toBeGreaterThan(r.cap);
    expect(r.capApplied).toBe(true);
    expect(r.totalDiscounted).toBe(r.cap);
  });

  it('시작일과 종료일이 같은 해 한 달이면 1행이다', () => {
    const r = evaluateAnnuity({
      startDate: '2026-05-01', endDate: '2026-05-31', paymentDay: 15, monthlyAmount: 50_000,
    });
    expect(r.rows).toEqual([
      { year: 2026, seq: 1, payments: 1, principal: 50_000, discounted: 50_000 },
    ]);
  });
});
