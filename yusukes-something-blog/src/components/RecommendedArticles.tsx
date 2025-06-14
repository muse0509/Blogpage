// src/components/RecommendedArticles.tsx
import ArticleCard, { ArticleForCard } from './ArticleCard';
import styles from './RecommendedArticles.module.css';

// このコンポーネントが受け取るプロパティの型を定義
interface RecommendedArticlesProps {
  articles: ArticleForCard[];
}

const RecommendedArticles = ({ articles }: RecommendedArticlesProps) => {
  // 記事が0件の場合はセクション自体を表示しない
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className={styles.recommendedSection}>
      <h2 className={styles.sectionTitle}>あなたへのおすすめ</h2>
      <div className={styles.articlesGrid}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedArticles;