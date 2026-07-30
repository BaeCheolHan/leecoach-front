/** 인장 문자 배치 규칙. 순수 함수 — 테스트 대상. */
export function sealLayout(name: string): string[][] {
  const chars = [...name.replace(/\s/g, '')];
  if (chars.length <= 1) return [chars];
  if (chars.length === 2) return [[chars[0]], [chars[1]]];
  if (chars.length === 3) return [[chars[0], chars[1]], [chars[2], '인']];
  const half = Math.ceil(chars.length / 2);
  return [chars.slice(0, half), chars.slice(half)];
}

/**
 * 성명으로 원형 인장 PNG(dataURL)를 생성한다. 브라우저 전용(canvas).
 * 서체: 자체 호스팅 나눔명조(전서체 대체 — 자유 라이선스 한글 전서체 부재).
 */
export function drawSeal(name: string, sizePx = 240): string {
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d')!;
  const red = '#c0392b';
  const center = sizePx / 2;

  // 원형 테두리
  ctx.strokeStyle = red;
  ctx.lineWidth = sizePx * 0.05;
  ctx.beginPath();
  ctx.arc(center, center, center - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();

  // 문자 배치
  const rows = sealLayout(name);
  const maxCols = Math.max(...rows.map((r) => r.length));
  const inner = sizePx * 0.62; // 문자 영역 한 변
  const cell = inner / Math.max(rows.length, maxCols);
  ctx.fillStyle = red;
  ctx.font = `bold ${Math.floor(cell * 0.85)}px "NanumMyeongjo", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  rows.forEach((row, ri) => {
    const y = center + (ri - (rows.length - 1) / 2) * cell;
    row.forEach((ch, ci) => {
      const x = center + (ci - (row.length - 1) / 2) * cell;
      ctx.fillText(ch, x, y);
    });
  });
  return canvas.toDataURL('image/png');
}
