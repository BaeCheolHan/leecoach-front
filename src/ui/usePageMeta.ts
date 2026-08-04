import { useEffect } from 'react';
import { SITE_ORIGIN } from '../config';

export interface PageMeta {
  title: string;
  description: string;
  /** canonical 경로 (예: '/guide') */
  path: string;
  /** 검색 노출을 막아야 하는 페이지(예: 완료 페이지)면 true — <meta name="robots" content="noindex"> 삽입 */
  noindex?: boolean;
}

/** SPA 페이지별 title·description·canonical 갱신 (검색엔진은 JS 렌더 후 값을 읽는다) */
export function usePageMeta({ title, description, path, noindex }: PageMeta): void {
  useEffect(() => {
    document.title = title;

    let desc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = description;

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_ORIGIN}${path}`;

    if (noindex) {
      let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex';
    }
  }, [title, description, path, noindex]);
}
