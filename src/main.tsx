import { StrictMode, Suspense, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { resolvePage } from './ui/resolvePage.tsx'
import { RootErrorBoundary } from './ui/RootErrorBoundary.tsx'
import './ui/App.css'

// index.html의 인라인 부트 가드가 진입 스크립트/스타일(/assets/*) 404를 감지해 재시도 횟수를
// 센다. 이 파일이 실행됐다는 것 자체가 진입 번들이 정상 로드됐다는 뜻이므로 — 렌더 성공 여부와
// 무관하게 — 그 문제는 이미 해소된 것이다. 카운터를 지우지 않으면 이후 실제로 새로 실패했을 때
// 남은 재시도 횟수가 줄어든 채로 시작한다.
sessionStorage.removeItem('entry-asset-reload-attempts')

// www는 "가이드 입구": 루트는 /guide로, 그 외 경로는 메인 도메인의 같은 경로로 이동
// (Cloudflare Pages _redirects가 호스트 규칙을 지원하지 않아 클라이언트에서 처리)
if (window.location.hostname === 'www.leecoachmom.com') {
  const { pathname, search } = window.location
  const target = pathname === '/' ? '/guide' : pathname + search
  window.location.replace(`https://leecoachmom.com${target}`)
}

const Page = resolvePage(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <Suspense fallback={<div className="page-loading" />}>
        {createElement(Page)}
      </Suspense>
    </RootErrorBoundary>
  </StrictMode>,
)
