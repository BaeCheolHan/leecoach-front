import { ARTICLES } from './articles';

export function RelatedGuides({ current }: { current: string }) {
  const currentIndex = ARTICLES.findIndex((article) => article.path === current);
  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  const related = Array.from({ length: 2 }, (_, offset) => ARTICLES[(startIndex + offset) % ARTICLES.length]).filter(
    (article) => article.path !== current,
  );

  return (
    <section className="related-guides">
      <h2>다음에 읽어보세요</h2>
      {related.map((article) => (
        <a key={article.path} className="card guide-card" href={article.path}>
          <h3>{article.title}</h3>
          <p>{article.summary}</p>
          <span className="guide-more">읽어보기 →</span>
        </a>
      ))}
    </section>
  );
}
