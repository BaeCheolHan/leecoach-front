import type { ComponentType } from 'react';
import App from './App';
import { Privacy } from './Privacy';
import { NotFound } from './NotFound';
import { GuideIndex } from './guide/GuideIndex';
import { AnnuityGiftReport } from './guide/AnnuityGiftReport';
import { GiftDeductionLimits } from './guide/GiftDeductionLimits';
import { MinorStockAccount } from './guide/MinorStockAccount';
import { LoanVsGift } from './guide/LoanVsGift';
import { NoReportRisks } from './guide/NoReportRisks';
import { LateReportChecklist } from './guide/LateReportChecklist';
import { TaxFreeMoney } from './guide/TaxFreeMoney';
import { GrandparentGift } from './guide/GrandparentGift';
import { SpouseGift } from './guide/SpouseGift';
import { GiftRoadmap } from './guide/GiftRoadmap';

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
    case '/guide/loan-vs-gift':
      return LoanVsGift;
    case '/guide/no-report-risks':
      return NoReportRisks;
    case '/guide/late-report-checklist':
      return LateReportChecklist;
    case '/guide/tax-free-money':
      return TaxFreeMoney;
    case '/guide/grandparent-gift':
      return GrandparentGift;
    case '/guide/spouse-gift':
      return SpouseGift;
    case '/guide/gift-roadmap':
      return GiftRoadmap;
    default:
      return NotFound;
  }
}
