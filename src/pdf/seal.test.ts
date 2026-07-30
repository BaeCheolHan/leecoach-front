import { describe, it, expect } from 'vitest';
import { sealLayout } from './seal';

describe('sealLayout — 인장 문자 배치', () => {
  it('1자: 단독 중앙', () => {
    expect(sealLayout('김')).toEqual([['김']]);
  });
  it('2자: 세로 2행', () => {
    expect(sealLayout('철수')).toEqual([['철'], ['수']]);
  });
  it("3자: 2x2 격자, 말미에 '인' 추가", () => {
    expect(sealLayout('홍길동')).toEqual([['홍', '길'], ['동', '인']]);
  });
  it('4자: 2x2 격자', () => {
    expect(sealLayout('남궁민수')).toEqual([['남', '궁'], ['민', '수']]);
  });
  it('5자 이상: 두 행 분할', () => {
    expect(sealLayout('가나다라마')).toEqual([['가', '나', '다'], ['라', '마']]);
  });
  it('공백은 제거한다', () => {
    expect(sealLayout('홍 길동')).toEqual([['홍', '길'], ['동', '인']]);
  });
});
