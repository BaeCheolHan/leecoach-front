import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { registerFonts } from './fonts';
import { ScheduleDoc } from './ScheduleDoc';
import { evaluateAnnuity } from '../domain/annuity';
import type { FormValues } from '../ui/schema';

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울특별시 강남구 테헤란로 1', phone: '010-1234-5678' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울특별시 강남구 테헤란로 1', phone: '', relation: '자' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123-45-678901' },
};

describe('ScheduleDoc', () => {
  it('10년 시나리오가 1페이지로 생성된다', async () => {
    registerFonts(path.resolve('public/fonts'));
    const result = evaluateAnnuity(values.terms);
    const buf = await renderToBuffer(
      <ScheduleDoc values={values} result={result} doneeBirthDate="2021-03-01" isDoneeMinor={true} />,
    );
    const pdf = await PDFDocument.load(buf);
    expect(pdf.getPageCount()).toBe(1);
  });
});
