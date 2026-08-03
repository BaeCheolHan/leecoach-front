import { evaluateAnnuity } from './annuity';

export interface AnnuitySchedule {
  startDate: string;
  endDate: string;
  paymentDay: number;
}

/**
 * 남은 공제 한도(availableLimit) 안에 들어오는 최대 월 지급액.
 * 상품·수익률과 무관하게 공제 한도와 유기정기금 평가 규약(3% 할인·20배 상한)만으로
 * 정해지는 세법 산술이다 — 추천·권유가 아니다 (2단계 기획 §3 B1).
 *
 * 평가액은 월액에 단조증가하므로 이분탐색으로 경계를 찾는다.
 */
export function maxAnnuityMonthlyWithinLimit(
  schedule: AnnuitySchedule, availableLimit: number,
): number {
  if (!Number.isFinite(availableLimit) || availableLimit <= 0) return 0;

  const valuation = (monthlyAmount: number) =>
    evaluateAnnuity({ ...schedule, monthlyAmount }).totalDiscounted;

  // 지급 회차가 0이면 평가액이 늘 0이라 경계가 없다.
  if (valuation(1) <= 0) return 0;

  // 첫 역년에 지급이 없는 스케줄(예: 시작일 12/31, 지급일 1일)은 첫 회차부터 3% 할인이
  // 적용돼 평가액 < 월액일 수 있다. 그래서 "한도액 자체가 안전한 상한"이라는 가정을
  // 쓸 수 없고, 평가액이 한도를 넘어설 때까지 상한을 2배씩 늘려 찾는다.
  let low = 0;
  let high = 1;
  while (valuation(high) <= availableLimit && high < 1e12) high *= 2;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (valuation(mid) <= availableLimit) low = mid;
    else high = mid - 1;
  }
  return low;
}
