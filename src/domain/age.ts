import { ADULT_AGE } from '../config';

/** 만 나이. 날짜는 'YYYY-MM-DD' 문자열 — 사전순 비교가 날짜순과 일치함을 이용한다. */
export function internationalAge(birthDate: string, atDate: string): number {
  const years = Number(atDate.slice(0, 4)) - Number(birthDate.slice(0, 4));
  const birthdayPassed = atDate.slice(5) >= birthDate.slice(5); // 'MM-DD' 비교
  return birthdayPassed ? years : years - 1;
}

export function isMinor(birthDate: string, atDate: string): boolean {
  return internationalAge(birthDate, atDate) < ADULT_AGE;
}
