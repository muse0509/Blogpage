// src/pages/index.tsx
import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link'; // ページネーションのリンク用にインポート
import SearchBar from '../components/SearchBar';
import GenreTabs, { GenreTab } from '../components/GenreTabs'; // GenreTab 型をインポート (またはここで定義)
import ArticleList from '../components/ArticleList';
import RecommendedArticles from '../components/RecommendedArticles';

// Article型 (共通ファイルからインポート推奨)
interface Article {
  id: string;
  title: string;
  genre: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  thumbnailUrl?: string;
  slug?: string;
  excerpt?: string;
}


import styles from '../styles/Home.module.css';

const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

const ARTICLES_PER_PAGE = 5; // 1ページあたりの記事数

export default function Home() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [selectedGenreSlug, setSelectedGenreSlug] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayGenres, setDisplayGenres] = useState<GenreTab[]>([
    { id: 'all', name: 'すべて', slug: 'all' },
  ]);

  // ★ ページネーション用のstate
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchArticlesAndSetGenres = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1); // データ再取得時は1ページ目に戻す
      try {
        const response = await fetch('/api/admin/articles');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '記事の取得に失敗しました。' }));
          throw new Error(errorData.message);
        }
        const data: Article[] = await response.json();
        const publishedArticles = data.filter(article => article.published);
        setAllArticles(publishedArticles);

        if (publishedArticles.length > 0) {
          const uniqueGenreNames = Array.from(new Set(publishedArticles.map(article => article.genre)))
            .filter(g => g && g.trim() !== '');
          const dynamicGenreTabs: GenreTab[] = uniqueGenreNames.map(name => ({
            id: generateSlug(name),
            name: name,
            slug: generateSlug(name),
          }));
          setDisplayGenres([
            { id: 'all', name: 'すべて', slug: 'all' },
            ...dynamicGenreTabs.sort((a, b) => a.name.localeCompare(b.name, 'ja')),
          ]);
        } else {
          setDisplayGenres([{ id: 'all', name: 'すべて', slug: 'all' }]);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching articles and setting genres:", err);
        setDisplayGenres([{ id: 'all', name: 'すべて', slug: 'all' }]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticlesAndSetGenres();
  }, []);

  // ★ フィルタリングされた記事リストと総ページ数を計算
  const { articlesToDisplayOnPage, totalPages } = useMemo(() => {
    let filtered = allArticles;

    if (selectedGenreSlug !== 'all') {
      const targetGenre = displayGenres.find(g => g.slug === selectedGenreSlug);
      if (targetGenre) {
        filtered = filtered.filter(article => article.genre === targetGenre.name);
      } else if (selectedGenreSlug !== 'all') {
        filtered = [];
      }
    }

    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(lowerCaseQuery) ||
        (article.content && article.content.toLowerCase().includes(lowerCaseQuery)) ||
        article.genre.toLowerCase().includes(lowerCaseQuery)
      );
    }

    const calculatedTotalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    
    return {
      articlesToDisplayOnPage: filtered.slice(startIndex, endIndex),
      totalPages: calculatedTotalPages,
    };
  }, [allArticles, selectedGenreSlug, searchQuery, displayGenres, currentPage]);

  const handleSelectGenre = (genreSlug: string) => {
    setSelectedGenreSlug(genreSlug);
    setCurrentPage(1); // ジャンル変更時は1ページ目に戻す
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 検索実行時は1ページ目に戻す
  };

  const siteTitleBase = "Yusuke's SomeThing";
  const currentDisplayingGenreObject = displayGenres.find(g => g.slug === selectedGenreSlug);
  const currentDisplayingGenreName = currentDisplayingGenreObject?.name || '記事';
  const pageTitle = searchQuery
    ? `「${searchQuery}」の検索結果 | ${siteTitleBase}`
    : `${currentDisplayingGenreName} | ${siteTitleBase}`;

  // ★ ページネーションコントロールのレンダリング
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null; // 1ページ以下の場合は表示しない

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav className={styles.pagination}>
        {currentPage > 1 && (
          <button onClick={() => setCurrentPage(currentPage - 1)} className={styles.pageLink}>
            前へ
          </button>
        )}
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => setCurrentPage(number)}
            className={`${styles.pageLink} ${currentPage === number ? styles.activePage : ''}`}
          >
            {number}
          </button>
        ))}
        {currentPage < totalPages && (
          <button onClick={() => setCurrentPage(currentPage + 1)} className={styles.pageLink}>
            次へ
          </button>
        )}
      </nav>
    );
  };

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

        <SearchBar onSearch={handleSearch} />
        <GenreTabs genres={displayGenres} onSelectGenre={handleSelectGenre} />

        <h2 className={styles.sectionHeading}>
          {searchQuery
            ? `「${searchQuery}」の検索結果 (${allArticles.filter(article => (article.title.toLowerCase().includes(searchQuery.toLowerCase()) || (article.content && article.content.toLowerCase().includes(searchQuery.toLowerCase())) || article.genre.toLowerCase().includes(searchQuery.toLowerCase())) && (selectedGenreSlug === 'all' || (displayGenres.find(g => g.slug === selectedGenreSlug)?.name === article.genre)) ).length}件)` // 検索結果の総件数を表示
            : `${currentDisplayingGenreName}の記事`}
        </h2>
        
        {isLoading && <p className={styles.loadingMessage}>記事を読み込んでいます...</p>}
        {error && <p className={styles.errorMessage} style={{ color: 'red' }}>エラー: {error}</p>}
        {!isLoading && !error && articlesToDisplayOnPage.length === 0 && searchQuery && (
          <p className={styles.infoMessage}>「{searchQuery}」に一致する記事は見つかりませんでした。</p>
        )}
        {!isLoading && !error && articlesToDisplayOnPage.length === 0 && !searchQuery && (
          <p className={styles.infoMessage}>{currentDisplayingGenreName}の記事はまだありません。</p>
        )}
        {!isLoading && !error && articlesToDisplayOnPage.length > 0 && (
          <ArticleList articles={articlesToDisplayOnPage} /> // ★ 表示するのは現在のページの記事のみ
        )}

        {renderPaginationControls()} {/* ★ ページネーションコントロールを表示 */}

        <RecommendedArticles />
      </div>
    </>
  );
}