import { StrictMode, Suspense, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { resolvePage } from './ui/resolvePage.tsx'
import './ui/App.css'

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
    <Suspense fallback={<div className="page-loading" />}>
      {createElement(Page)}
    </Suspense>
  </StrictMode>,
)
