// src/pages/index.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import SearchBar from '../components/SearchBar';
import GenreTabs from '../components/GenreTabs';
import ArticleList from '../components/ArticleList';
import RecommendedArticles from '../components/RecommendedArticles';
// dummyArticles, dummyGenres は GenreTabs や RecommendedArticles でまだ使っているかもしれないので残しつつ、
// Article 型はAPIから取得するデータ構造に合わせるか、共通化します。
import { dummyGenres, recommendedArticles as initialRecommended } from '../../lib/dummyData'; // dummyArticles のインポートを削除または変更
import type { Genre } from '../../lib/dummyData'; // Genre 型をインポート
import type { ArticleData as Article } from '../api/admin/articles'; // APIの型定義をArticleとしてインポート
import styles from '../styles/Home.module.css';

export default function Home() {
  const [allArticles, setAllArticles] = useState<Article[]>([]); // APIから取得した全記事
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true); // ローディング状態
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  // 記事データをAPIから取得する
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/articles'); // GETリクエスト
        if (!response.ok) {
          throw new Error('記事の取得に失敗しました。');
        }
        const data: Article[] = await response.json();
        setAllArticles(data);
        setFilteredArticles(data); // 初期表示は全記事
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching articles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []); // 空の依存配列なので、コンポーネントのマウント時に1回だけ実行

  const handleSelectGenre = (genreSlug: string) => {
    setSelectedGenre(genreSlug);
    if (genreSlug === 'all') {
      setFilteredArticles(allArticles);
    } else {
      const targetGenre = dummyGenres.find(g => g.slug === genreSlug); // ジャンルデータはまだダミーを使用
      if (targetGenre) {
        setFilteredArticles(
          allArticles.filter((article) => article.genre === targetGenre.name)
        );
      } else {
        setFilteredArticles([]); // 一致するジャンルがなければ空にする
      }
    }
  };

  // ... （ページタイトル設定などは変更なし） ...
  const siteTitleBase = "Yusuke's SomeThing";
  const pageTitle = selectedGenre === 'all'
    ? `ホーム | ${siteTitleBase}`
    : `${dummyGenres.find(g => g.slug === selectedGenre)?.name || ''}の記事一覧 | ${siteTitleBase}`;


  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Yusukeの読書記録、ブロックチェーン、金融に関する考察ブログ" />
      </Head>

      <div className={styles.container}>
        <header className={styles.mainHeader}>
          <h1 className={styles.mainTitle}>Yusuke's Thoughts & Readings</h1>
          <p className={styles.subTitle}>日々の思索、学び、そして読書の記録</p>
        </header>

        <SearchBar />

        {/* GenreTabsに渡すジャンルは、allArticlesから動的に生成することも検討できます */}
        <GenreTabs genres={dummyGenres} onSelectGenre={handleSelectGenre} />

        <h2 className={styles.sectionHeading}>
          {selectedGenre === 'all'
            ? 'すべての記事'
            : `${dummyGenres.find(g => g.slug === selectedGenre)?.name || '記事'} の記事`}
        </h2>
        
        {isLoading && <p>記事を読み込んでいます...</p>}
        {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
        {!isLoading && !error && <ArticleList articles={filteredArticles} />}

        {/* おすすめ記事もAPIから取得するか、別途ロジックが必要になります */}
        {!isLoading && !error && <RecommendedArticles articles={initialRecommended} />}
      </div>
    </>
  );
}