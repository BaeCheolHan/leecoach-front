import type { ReactElement } from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';

export function pdfFileName(
  kind: '증여계약서' | '유기정기금평가명세서', doneeName: string, date: string,
): string {
  return `${kind}_${doneeName}_${date.replaceAll('-', '')}.pdf`;
}

export async function renderPdfBlob(doc: ReactElement<DocumentProps>): Promise<Blob> {
  return pdf(doc).toBlob();
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/**
 * PDF 파일들을 저장한다.
 * 모바일(iOS/Android)에서는 공유 시트로 띄워 "파일에 저장"으로 한 번에 저장할 수 있게 한다
 * — iOS Safari는 blob 다운로드를 뷰어로 열어버리고, 터치 1회당 다운로드 1회만 허용하기 때문.
 * 공유가 불가하거나 사용자가 취소하면(데스크톱 포함) 앵커 다운로드로 폴백한다.
 * 주의: 사용자 제스처 활성화가 살아있는 동안 호출돼야 하므로 blob은 미리 만들어 캐시해 둘 것.
 */
export async function savePdfFiles(items: { blob: Blob; filename: string }[]): Promise<void> {
  if (isMobile() && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    const files = items.map((i) => new File([i.blob], i.filename, { type: 'application/pdf' }));
    if (navigator.canShare({ files })) {
      try {
        await navigator.share({ files });
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return; // 사용자가 공유 시트를 닫음
        // NotAllowedError 등 — 앵커 다운로드로 폴백
      }
    }
  }
  for (const i of items) saveBlob(i.blob, i.filename);
}

/** @deprecated 활성화 만료 문제로 신규 코드는 renderPdfBlob + savePdfFiles 조합을 쓸 것 */
export async function downloadPdf(doc: ReactElement<DocumentProps>, filename: string): Promise<void> {
  const blob = await renderPdfBlob(doc);
  await savePdfFiles([{ blob, filename }]);
}
