import { describe, it, expect } from 'vitest';
import { formSchema } from './schema';

const valid = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울시 강남구', phone: '010-1234-5678' },
  donee: {
    name: '홍아기', rrn: '210301-3999999', address: '서울시 강남구', phone: '',
    relation: '자', legalRepName: '홍길동',
  },
  terms: {
    startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체',
    paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123-45-678',
  },
};

describe('formSchema', () => {
  it('유효한 전체 입력을 통과시킨다', () => {
    expect(formSchema.safeParse(valid).success).toBe(true);
  });
  it('잘못된 주민번호를 거부한다', () => {
    const bad = structuredClone(valid);
    bad.donor.rrn = '800101-1000001';
    expect(formSchema.safeParse(bad).success).toBe(false);
  });
  it('시작일 >= 종료일을 거부한다', () => {
    const bad = structuredClone(valid);
    bad.terms.endDate = '2026-01-01';
    expect(formSchema.safeParse(bad).success).toBe(false);
  });
  it('증여액 0원을 거부한다', () => {
    const bad = structuredClone(valid);
    bad.terms.monthlyAmount = 0;
    expect(formSchema.safeParse(bad).success).toBe(false);
  });
  it('기타 방법 선택 시 상세 입력을 요구한다', () => {
    const bad = structuredClone(valid);
    bad.terms.method = '기타';
    expect(formSchema.safeParse(bad).success).toBe(false);
    (bad.terms as Record<string, unknown>).methodEtc = '수표 교부';
    expect(formSchema.safeParse(bad).success).toBe(true);
  });
});
