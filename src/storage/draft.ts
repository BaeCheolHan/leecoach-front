import type { FormValues } from '../ui/schema';

export const DRAFT_KEY = 'gift-annuity-draft-v1';

/** 주민등록번호는 브라우저에도 저장하지 않는다 — 공용 PC 잔존 위험 (스펙 결정 사항). */
export function saveDraft(values: FormValues): void {
  const sanitized: FormValues = {
    ...values,
    donor: { ...values.donor, rrn: '' },
    donee: { ...values.donee, rrn: '' },
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(sanitized));
}

export function loadDraft(): FormValues | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FormValues;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
