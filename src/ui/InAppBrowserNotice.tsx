import { useState } from 'react';

/** 인스타그램·카카오톡 등 인앱 브라우저 감지 — 파일 다운로드·공유가 제한되는 환경 */
export function isInAppBrowser(ua: string = navigator.userAgent): boolean {
  return /Instagram|KAKAOTALK|FBAN|FBAV|FB_IAB|Line\//i.test(ua);
}

export function InAppBrowserNotice() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !isInAppBrowser()) return null;
  return (
    <div className="inapp-notice" role="status">
      <p>
        인스타그램·카카오톡 안에서 열면 <b>PDF 저장이 제한될 수 있어요.</b>
        <br />
        우측 상단 <b>⋯ 메뉴 → 외부 브라우저로 열기</b>를 눌러 주세요.
      </p>
      <button type="button" aria-label="안내 닫기" onClick={() => setDismissed(true)}>
        ✕
      </button>
    </div>
  );
}
