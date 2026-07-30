import type { ReactElement } from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';

export function pdfFileName(
  kind: '증여계약서' | '유기정기금평가명세서', doneeName: string, date: string,
): string {
  return `${kind}_${doneeName}_${date.replaceAll('-', '')}.pdf`;
}

export async function downloadPdf(doc: ReactElement<DocumentProps>, filename: string): Promise<void> {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
