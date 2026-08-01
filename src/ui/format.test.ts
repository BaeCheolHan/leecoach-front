import { describe, it, expect } from 'vitest';
import { formatPhoneInput, koreanAmount } from './format';

describe('koreanAmount', () => {
  it('만 단위 금액을 한글로 표기한다', () => {
    expect(koreanAmount(500000)).toBe('50만원');
    expect(koreanAmount(5000000)).toBe('500만원');
  });
  it('억 단위를 표기한다', () => {
    expect(koreanAmount(100000000)).toBe('1억원');
    expect(koreanAmount(123456789)).toBe('1억 2,345만 6,789원');
  });
  it('만 미만 끝자리를 표기한다', () => {
    expect(koreanAmount(9999)).toBe('9,999원');
    expect(koreanAmount(10001)).toBe('1만 1원');
  });
  it('0 이하나 비정상 값은 빈 문자열', () => {
    expect(koreanAmount(0)).toBe('');
    expect(koreanAmount(-5)).toBe('');
    expect(koreanAmount(NaN)).toBe('');
  });
});

describe('formatPhoneInput', () => {
  it('휴대폰 11자리를 3-4-4로 포맷한다', () => {
    expect(formatPhoneInput('01012345678')).toBe('010-1234-5678');
  });
  it('입력 중간 단계도 자연스럽게 포맷한다', () => {
    expect(formatPhoneInput('010')).toBe('010');
    expect(formatPhoneInput('0101234')).toBe('010-1234');
    expect(formatPhoneInput('010123456')).toBe('010-1234-56');
  });
  it('서울 02 번호는 2-4-4로 포맷한다', () => {
    expect(formatPhoneInput('0212345678')).toBe('02-1234-5678');
  });
  it('10자리 지역번호는 3-3-4로 포맷한다', () => {
    expect(formatPhoneInput('0311234567')).toBe('031-123-4567');
  });
  it('숫자 외 문자는 제거하고 11자리 초과는 잘라낸다', () => {
    expect(formatPhoneInput('010-1234-5678999')).toBe('010-1234-5678');
    expect(formatPhoneInput('010 1234 5678')).toBe('010-1234-5678');
  });
});
