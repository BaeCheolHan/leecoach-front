import type { ComponentType } from 'react';
import App from './App';
import { Privacy } from './Privacy';
import { NotFound } from './NotFound';
import { GuideIndex } from './guide/GuideIndex';
import { AnnuityGiftReport } from './guide/AnnuityGiftReport';

/** 경로 → 페이지 컴포넌트. 라우터 없이 pathname으로 분기 (_redirects가 SPA 폴백 제공) */
export function resolvePage(pathname: string): ComponentType {
  const clean = pathname.replace(/\/+$/, '') || '/';
  switch (clean) {
    case '/':
      return App;
    case '/privacy':
      return Privacy;
    case '/guide':
      return GuideIndex;
    case '/guide/annuity-gift-report':
      return AnnuityGiftReport;
    default:
      return NotFound;
  }
}
