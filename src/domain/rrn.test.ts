import { describe, it, expect } from 'vitest';
import { formatRrnInput, parseRrn } from './rrn';

describe('parseRrn', () => {
  it('유효한 1900년대 남성 주민번호를 파싱한다', () => {
    // 800101-1000008: 체크섬 유효 (가중치 2~9,2~5 합=36, (11-36%11)%10=8)
    expect(parseRrn('800101-1000008')).toEqual({ birthDate: '1980-01-01', gender: 'M' });
  });
  it('유효한 2000년대 여성 주민번호를 파싱한다', () => {
    // 100215-4000003: 체크섬 유효 (합=85, (11-85%11)%10=3)
    expect(parseRrn('100215-4000003')).toEqual({ birthDate: '2010-02-15', gender: 'F' });
  });
  it('2020-10-05 이후 출생은 체크섬 없이 형식·날짜만 검사한다', () => {
    expect(parseRrn('210301-3999999')).toEqual({ birthDate: '2021-03-01', gender: 'M' });
  });
  it('형식 오류를 거부한다', () => {
    expect(parseRrn('8001011000008')).toBeNull();   // 하이픈 없음
    expect(parseRrn('800101-100000')).toBeNull();   // 자리수 부족
  });
  it('존재하지 않는 날짜를 거부한다', () => {
    expect(parseRrn('800231-1000000')).toBeNull();  // 2월 31일
  });
  it('체크섬 오류를 거부한다 (2020-10-05 이전 출생)', () => {
    expect(parseRrn('800101-1000001')).toBeNull();
  });
});

describe('formatRrnInput', () => {
  it('6자리까지는 하이픈 없이 그대로 둔다', () => {
    expect(formatRrnInput('')).toBe('');
    expect(formatRrnInput('80010')).toBe('80010');
    expect(formatRrnInput('800101')).toBe('800101');
  });
  it('7자리째부터 하이픈을 자동 삽입한다', () => {
    expect(formatRrnInput('8001011')).toBe('800101-1');
    expect(formatRrnInput('8001011000008')).toBe('800101-1000008');
  });
  it('이미 하이픈이 있는 입력(붙여넣기)도 정규화한다', () => {
    expect(formatRrnInput('800101-1000008')).toBe('800101-1000008');
  });
  it('숫자 외 문자는 제거한다', () => {
    expect(formatRrnInput('80 0101 100000ab8')).toBe('800101-1000008');
  });
  it('13자리를 넘는 숫자는 잘라낸다', () => {
    expect(formatRrnInput('80010110000081234')).toBe('800101-1000008');
  });
});
