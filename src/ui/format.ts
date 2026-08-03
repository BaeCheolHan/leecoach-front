/** 입력 중인 전화번호를 하이픈 포맷으로 정규화 (휴대폰 3-4-4, 서울 2-4-4, 지역 3-3-4) */
export function formatPhoneInput(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('02')) {
    d = d.slice(0, 10);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `02-${d.slice(2)}`;
    return `02-${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  }
  d = d.slice(0, 11);
  if (d.startsWith('01')) {
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
}

/** 기간 프리셋용 종료일: 시작일 + N년 - 1일 (YYYY-MM-DD) */
export function presetEndDate(startDate: string, years: number): string {
  const d = new Date(`${startDate}T00:00:00`);
  d.setFullYear(d.getFullYear() + years);
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'YYYY-MM-DD' → '연도년 월일' 한국어 표기 (예: '2026-08-04' → '2026년 8월 4일') */
export function formatKoreanDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

/** 원 단위 금액을 억/만 단위 한글 표기로 변환 (예: 5000000 → "500만원") */
export function koreanAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';
  const eok = Math.floor(n / 1e8);
  const man = Math.floor((n % 1e8) / 1e4);
  const rest = n % 1e4;
  const parts: string[] = [];
  if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man) parts.push(`${man.toLocaleString('ko-KR')}만`);
  if (rest) parts.push(rest.toLocaleString('ko-KR'));
  return `${parts.join(' ')}원`;
}
