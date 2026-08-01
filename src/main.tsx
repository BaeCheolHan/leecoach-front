import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { resolvePage } from './ui/resolvePage.tsx'
import './ui/App.css'

const Page = resolvePage(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {createElement(Page)}
  </StrictMode>,
)
