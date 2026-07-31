import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './ui/App.tsx'
import { Privacy } from './ui/Privacy.tsx'
import './ui/App.css'

// 페이지가 둘뿐이라 라우터 없이 경로로 분기 (_redirects가 SPA 폴백 제공)
const page = window.location.pathname === '/privacy' ? <Privacy /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page}
  </StrictMode>,
)
