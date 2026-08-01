import type { ComponentType } from 'react';
import App from './App';
import { Privacy } from './Privacy';
import { NotFound } from './NotFound';
import { GuideIndex } from './guide/GuideIndex';
import { AnnuityGiftReport } from './guide/AnnuityGiftReport';
import { GiftDeductionLimits } from './guide/GiftDeductionLimits';
import { MinorStockAccount } from './guide/MinorStockAccount';

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
    case '/guide/gift-deduction-limits':
      return GiftDeductionLimits;
    case '/guide/minor-stock-account':
      return MinorStockAccount;
    default:
      return NotFound;
  }
}
