export interface RrnInfo {
  birthDate: string; // 'YYYY-MM-DD'
  gender: 'M' | 'F';
}

/** 7번째 자리 → 출생 세기. 5~8은 외국인등록번호 체계. */
const CENTURY: Record<string, number> = {
  '1': 1900, '2': 1900, '3': 2000, '4': 2000,
  '5': 1900, '6': 1900, '7': 2000, '8': 2000, '9': 1800, '0': 1800,
};

/** 뒷자리 임의부여 시행일 — 이날 이후 출생은 체크섬 검증 불가 */
const RANDOM_TAIL_SINCE = '2020-10-05';

const WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];

function checksumOk(digits: string): boolean {
  const sum = WEIGHTS.reduce((s, w, i) => s + w * Number(digits[i]), 0);
  return (11 - (sum % 11)) % 10 === Number(digits[12]);
}

/** 입력 중인 주민등록번호를 000000-0000000 꼴로 정규화 (숫자만 추출, 하이픈 자동 삽입) */
export function formatRrnInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  return digits.length > 6 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : digits;
}

export function parseRrn(rrn: string): RrnInfo | null {
  if (!/^\d{6}-\d{7}$/.test(rrn)) return null;
  const digits = rrn.replace('-', '');
  const century = CENTURY[digits[6]];
  if (century === undefined) return null;
  const year = century + Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (birthDate < RANDOM_TAIL_SINCE && !checksumOk(digits)) return null;
  return { birthDate, gender: Number(digits[6]) % 2 === 1 ? 'M' : 'F' };
}
