import { DISCOUNT_RATE, CAP_MULTIPLIER } from '../config';

export interface AnnuityInput {
  startDate: string;
  endDate: string;
  paymentDay: number;
  monthlyAmount: number;
  discountRate?: number;
}

export interface AnnuityYearRow {
  year: number;
  seq: number;
  payments: number;
  principal: number;
  discounted: number;
}

export interface AnnuityResult {
  rows: AnnuityYearRow[];
  totalPrincipal: number;
  sumDiscounted: number;
  cap: number;
  capApplied: boolean;
  totalDiscounted: number;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate(); // m: 1~12

/**
 * 상증세법 시행령 §62 1호 유기정기금 평가.
 * 역년(1/1~12/31) 단위로 절단, n = 역년 - 시작 역년 (첫 해 무할인), 연도별 원 단위 반올림 후 합산.
 * 규약은 참고 구현 실측으로 검증됨 — annuity.test.ts 픽스처 참조.
 */
export function evaluateAnnuity(input: AnnuityInput): AnnuityResult {
  const r = input.discountRate ?? DISCOUNT_RATE;
  const startYear = Number(input.startDate.slice(0, 4));
  const endYear = Number(input.endDate.slice(0, 4));
  const rows: AnnuityYearRow[] = [];
  let sumDiscountedRaw = 0;

  for (let year = startYear; year <= endYear; year++) {
    let payments = 0;
    for (let m = 1; m <= 12; m++) {
      const day = Math.min(input.paymentDay, daysInMonth(year, m));
      const date = `${year}-${pad2(m)}-${pad2(day)}`;
      if (date >= input.startDate && date <= input.endDate) payments++;
    }
    if (payments === 0) continue;
    const principal = payments * input.monthlyAmount;
    const n = year - startYear;
    const discountedRaw = principal / Math.pow(1 + r, n);
    sumDiscountedRaw += discountedRaw;
    rows.push({
      year,
      seq: rows.length + 1,
      payments,
      principal,
      discounted: Math.round(discountedRaw),
    });
  }

  const totalPrincipal = rows.reduce((s, x) => s + x.principal, 0);
  const sumDiscounted = Math.round(sumDiscountedRaw);
  const cap = input.monthlyAmount * 12 * CAP_MULTIPLIER;
  const capApplied = sumDiscounted > cap;
  return {
    rows, totalPrincipal, sumDiscounted, cap, capApplied,
    totalDiscounted: capApplied ? cap : sumDiscounted,
  };
}
