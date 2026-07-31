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
