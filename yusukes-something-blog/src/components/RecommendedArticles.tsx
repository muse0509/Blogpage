// components/RecommendedArticles.tsx
import { Article } from '../../lib/dummyData';
import ArticleCard from './ArticleCard'; // ArticleCardを再利用
import styles from './RecommendedArticles.module.css';

interface RecommendedArticlesProps {
  articles: Article[];
}

const RecommendedArticles = ({ articles }: RecommendedArticlesProps) => {
  if (articles.length === 0) {
    return null;
  }
  return (
    <section className={styles.recommendedSection}>
      <h2 className={styles.mainTitle}>あなたへのおすすめ</h2>
      <div className={styles.articlesGrid}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedArticles;