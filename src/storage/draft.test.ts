// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from './draft';
import type { FormValues } from '../ui/schema';

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울', phone: '010-1234-5678' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울', phone: '', relation: '자' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123' },
};

beforeEach(() => localStorage.clear());

describe('draft storage', () => {
  it('저장 후 불러오면 주민번호만 비어 있다', () => {
    saveDraft(values);
    const loaded = loadDraft()!;
    expect(loaded.donor.name).toBe('홍길동');
    expect(loaded.donor.rrn).toBe('');
    expect(loaded.donee.rrn).toBe('');
    expect(loaded.terms.monthlyAmount).toBe(100000);
  });
  it('원본 localStorage 문자열에 주민번호가 존재하지 않는다', () => {
    saveDraft(values);
    const raw = localStorage.getItem(DRAFT_KEY)!;
    expect(raw).not.toContain('800101');
    expect(raw).not.toContain('210301');
  });
  it('저장된 것이 없으면 null', () => {
    expect(loadDraft()).toBeNull();
  });
  it('깨진 JSON이면 null', () => {
    localStorage.setItem(DRAFT_KEY, '{broken');
    expect(loadDraft()).toBeNull();
  });
  it('clearDraft로 삭제된다', () => {
    saveDraft(values);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});
