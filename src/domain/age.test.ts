import { describe, it, expect } from 'vitest';
import { internationalAge, isMinor } from './age';

describe('internationalAge / isMinor', () => {
  it('생일 전날은 아직 나이를 먹지 않는다', () => {
    expect(internationalAge('2007-08-15', '2026-08-14')).toBe(18);
    expect(isMinor('2007-08-15', '2026-08-14')).toBe(true);
  });
  it('생일 당일 만 19세가 되어 성년이다', () => {
    expect(internationalAge('2007-08-15', '2026-08-15')).toBe(19);
    expect(isMinor('2007-08-15', '2026-08-15')).toBe(false);
  });
  it('연 나이 방식과 갈리는 케이스: 2010년 3월생은 2029년 6월에 이미 성년', () => {
    // 참고 사이트의 연 나이 방식(2010+19=2029년 말까지 미성년)과 달라야 한다
    expect(isMinor('2010-03-01', '2029-06-01')).toBe(false);
  });
  it('윤년 2/29 출생은 평년에 3/1 전날까지 이전 나이', () => {
    expect(internationalAge('2008-02-29', '2027-02-28')).toBe(18);
    expect(internationalAge('2008-02-29', '2027-03-01')).toBe(19);
  });
});
