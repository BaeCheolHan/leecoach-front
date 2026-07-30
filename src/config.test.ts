import { describe, it, expect } from 'vitest';
import { DISCOUNT_RATE, CAP_MULTIPLIER, ADULT_AGE, DISCLAIMER } from './config';

describe('config', () => {
  it('정책 상수가 스펙 값과 일치한다', () => {
    expect(DISCOUNT_RATE).toBe(0.03);
    expect(CAP_MULTIPLIER).toBe(20);
    expect(ADULT_AGE).toBe(19);
    expect(DISCLAIMER).toContain('세무 자문이 아닙니다');
  });
});
