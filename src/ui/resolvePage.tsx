import { lazy, type ComponentType } from 'react';

/** 경로 → lazy 페이지 컴포넌트. 라우터 없이 pathname으로 분기 (_redirects가 SPA 폴백 제공) */
export const PAGES: Record<string, ComponentType> = {
  '/': lazy(() => import('./App')),
  '/contract/done': lazy(() => import('./ContractDone').then((m) => ({ default: m.ContractDone }))),
  '/about': lazy(() => import('./About').then((m) => ({ default: m.About }))),
  '/privacy': lazy(() => import('./Privacy').then((m) => ({ default: m.Privacy }))),
  '/guide': lazy(() => import('./guide/GuideIndex').then((m) => ({ default: m.GuideIndex }))),
  '/guide/annuity-gift-report': lazy(() =>
    import('./guide/AnnuityGiftReport').then((m) => ({ default: m.AnnuityGiftReport })),
  ),
  '/guide/gift-deduction-limits': lazy(() =>
    import('./guide/GiftDeductionLimits').then((m) => ({ default: m.GiftDeductionLimits })),
  ),
  '/guide/minor-stock-account': lazy(() =>
    import('./guide/MinorStockAccount').then((m) => ({ default: m.MinorStockAccount })),
  ),
  '/guide/loan-vs-gift': lazy(() => import('./guide/LoanVsGift').then((m) => ({ default: m.LoanVsGift }))),
  '/guide/no-report-risks': lazy(() =>
    import('./guide/NoReportRisks').then((m) => ({ default: m.NoReportRisks })),
  ),
  '/guide/marriage-birth-deduction': lazy(() =>
    import('./guide/MarriageBirthDeduction').then((m) => ({ default: m.MarriageBirthDeduction })),
  ),
  '/guide/tax-free-money': lazy(() => import('./guide/TaxFreeMoney').then((m) => ({ default: m.TaxFreeMoney }))),
  '/guide/child-benefit-account': lazy(() =>
    import('./guide/ChildBenefitAccount').then((m) => ({ default: m.ChildBenefitAccount })),
  ),
  '/guide/grandparent-gift': lazy(() =>
    import('./guide/GrandparentGift').then((m) => ({ default: m.GrandparentGift })),
  ),
  '/guide/spouse-gift': lazy(() => import('./guide/SpouseGift').then((m) => ({ default: m.SpouseGift }))),
  '/guide/gift-roadmap': lazy(() => import('./guide/GiftRoadmap').then((m) => ({ default: m.GiftRoadmap }))),
  '404': lazy(() => import('./NotFound').then((m) => ({ default: m.NotFound }))),
};

export function resolvePage(pathname: string): ComponentType {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return PAGES[clean] ?? PAGES['404'];
}
