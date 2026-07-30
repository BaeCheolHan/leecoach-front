// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Step3Result } from './steps/Step3Result';
import type { FormValues } from './schema';

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울', phone: '' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울', phone: '', relation: '자', legalRepName: '홍길동' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123' },
};

describe('Step3Result', () => {
  it('평가 표와 합계를 렌더한다 (픽스처 값)', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByText('₩10,543,331')).toBeTruthy();  // 총 평가액
    expect(screen.getByText('₩12,000,000')).toBeTruthy();  // 총 불입원금
  });
  it('미성년 2천만 한도 이내 판정을 표시한다', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByText(/한도 이내.*예상 증여세.*0원/)).toBeTruthy();
  });
  it('다운로드 버튼 3개가 있다', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByRole('button', { name: '증여계약서 PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '평가명세서 PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '모두 다운로드' })).toBeTruthy();
  });
});
