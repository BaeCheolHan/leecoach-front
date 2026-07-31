import { describe, it, expect } from 'vitest';
import { koreanAmount } from './format';

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
