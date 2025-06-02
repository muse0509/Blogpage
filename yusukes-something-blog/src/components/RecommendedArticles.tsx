// src/components/RecommendedArticles.tsx
import { useState, useEffect } from 'react';
import ArticleCard, { ArticleForCard } from './ArticleCard';
import styles from './RecommendedArticles.module.css';

// APIから取得する記事の完全な型 (必要に応じて共通の型定義ファイルからインポート)
interface ApiArticle {
  id: string;
  title: string;
  genre: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  thumbnailUrl?: string;
  slug?: string;
}

const RecommendedArticles = () => {
  const [recommendedArticles, setRecommendedArticles] = useState<ArticleForCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRecommendArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/articles'); // 全記事を取得
        if (!response.ok) {
          throw new Error('おすすめ記事の取得に失敗しました。');
        }
        const allArticles: ApiArticle[] = await response.json();

        const publishedArticles = allArticles.filter(article => article.published);

        if (publishedArticles.length === 0) {
          setRecommendedArticles([]);
          setIsLoading(false); // ローディング終了
          return;
        }

        const shuffled = [...publishedArticles].sort(() => 0.5 - Math.random());
        const selectedArticles = shuffled.slice(0, Math.min(3, shuffled.length));

        const articlesForDisplay: ArticleForCard[] = selectedArticles.map(art => ({
          id: art.id,
          title: art.title,
          genre: art.genre,
          content: art.content,
          updatedAt: art.updatedAt,
          createdAt: art.createdAt, // ArticleForCard に createdAt があれば追加
          slug: art.slug,
          thumbnailUrl: art.thumbnailUrl,
        }));

        setRecommendedArticles(articlesForDisplay);

      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching recommended articles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndRecommendArticles();
  }, []);

  if (isLoading) {
    return (
      <section className={styles.recommendedSection}>
        <h2 className={styles.sectionTitle}>あなたへのおすすめ</h2>
        <p>読み込み中...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.recommendedSection}>
        <h2 className={styles.sectionTitle}>あなたへのおすすめ</h2>
        <p style={{ color: 'red' }}>エラー: {error}</p>
      </section>
    );
  }

  if (recommendedArticles.length === 0) {
    return null;
  }

  return (
    <section className={styles.recommendedSection}>
      <h2 className={styles.sectionTitle}>あなたへのおすすめ</h2>
      <div className={styles.articlesGrid}>
        {recommendedArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedArticles;