// src/pages/index.tsx
import { useState, useEffect, useMemo } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import SearchBar from '../components/SearchBar';
import GenreTabs from '../components/GenreTabs';
import type { GenreTab } from '../components/GenreTabs';
import ArticleList from '../components/ArticleList';
import RecommendedArticles from '../components/RecommendedArticles';
import type { ArticleForCard } from '../components/ArticleCard';

import { supabaseAdmin } from '../lib/supabaseClient';
import type { Article } from '../types';

import styles from '../styles/Home.module.css';

// ジャンル名からシンプルなスラッグを生成するヘルパー関数
const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

const ARTICLES_PER_PAGE = 5; // 1ページあたりの記事数

interface HomePageProps {
  initialArticles: ArticleForCard[];
  initialGenres: GenreTab[];
  recommendedArticles: ArticleForCard[];
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  try {
    const { data: articlesFromDb, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (error) { throw error; }

    const publishedArticles = articlesFromDb || [];

    const articlesForFrontend: ArticleForCard[] = publishedArticles.map(art => ({
      id: art.id,
      title: art.title,
      genre: art.genre,
      content: art.content || '',
      updatedAt: art.updated_at || '',
      createdAt: art.created_at || '',
      slug: art.slug || null,
      thumbnailUrl: art.thumbnail_url || null,
      likeCount: art.like_count || 0,
    }));

    const uniqueGenreNames = Array.from(new Set(articlesForFrontend.map(article => article.genre)))
      .filter(g => g && g.trim() !== '');
    const dynamicGenreTabs: GenreTab[] = uniqueGenreNames.map(name => ({
      id: generateSlug(name),
      name: name,
      slug: generateSlug(name),
    }));
    const initialGenres: GenreTab[] = [
      { id: 'all', name: 'すべて', slug: 'all' },
      ...dynamicGenreTabs.sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    ];

    const shuffle = <T,>(array: T[]): T[] => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };
    const shuffled = shuffle(articlesForFrontend);
    const recommendedArticles = shuffled.slice(0, 3);

    return {
      props: {
        initialArticles: articlesForFrontend,
        initialGenres,
        recommendedArticles,
      },
    };
  } catch (err) {
    console.error("Error in getServerSideProps for Home page:", err);
    return {
      props: {
        initialArticles: [],
        initialGenres: [{ id: 'all', name: 'すべて', slug: 'all' }],
        recommendedArticles: [],
      },
    };
  }
};

const Home: NextPage<HomePageProps> = ({ initialArticles, initialGenres, recommendedArticles }) => {
  const [allArticles, setAllArticles] = useState<ArticleForCard[]>(initialArticles);
  const [displayGenres, setDisplayGenres] = useState<GenreTab[]>(initialGenres);
  const [selectedGenreSlug, setSelectedGenreSlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredArticles = useMemo(() => {
    let articlesToDisplay = allArticles;

    if (selectedGenreSlug !== 'all') {
      const targetGenre = displayGenres.find(g => g.slug === selectedGenreSlug);
      if (targetGenre) {
        articlesToDisplay = articlesToDisplay.filter(
          (article) => article.genre === targetGenre.name
        );
      } else {
        articlesToDisplay = [];
      }
    }

    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      articlesToDisplay = articlesToDisplay.filter(article =>
        article.title.toLowerCase().includes(lowerCaseQuery) ||
        (article.content && article.content.toLowerCase().includes(lowerCaseQuery)) ||
        article.genre.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return articlesToDisplay;
  }, [allArticles, selectedGenreSlug, searchQuery, displayGenres]);

  const { articlesForCurrentPage, totalPages } = useMemo(() => {
    const calculatedTotalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    return {
      articlesForCurrentPage: filteredArticles.slice(startIndex, endIndex),
      totalPages: calculatedTotalPages,
    };
  }, [filteredArticles, currentPage]);

  const handleSelectGenre = (genreSlug: string) => {
    setSelectedGenreSlug(genreSlug);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const siteTitleBase = "Yusuke's SomeThing";
  const currentDisplayingGenreObject = displayGenres.find(g => g.slug === selectedGenreSlug);
  const currentDisplayingGenreName = currentDisplayingGenreObject?.name || '記事';
  const pageTitle = searchQuery
    ? `「${searchQuery}」の検索結果 | ${siteTitleBase}`
    : `${currentDisplayingGenreName} | ${siteTitleBase}`;

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return (
      <nav className={styles.pagination}>
        {currentPage > 1 && (
          <button onClick={() => setCurrentPage(currentPage - 1)} className={styles.pageLink}>前へ</button>
        )}
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => setCurrentPage(number)}
            className={`${styles.pageLink} ${currentPage === number ? styles.activePage : ''}`}
          >{number}</button>
        ))}
        {currentPage < totalPages && (
          <button onClick={() => setCurrentPage(currentPage + 1)} className={styles.pageLink}>次へ</button>
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
            ? `「${searchQuery}」の検索結果 (${filteredArticles.length}件)`
            : `${currentDisplayingGenreName}の記事`}
        </h2>
        
        {articlesForCurrentPage.length === 0 && searchQuery && (
          <p className={styles.infoMessage}>「{searchQuery}」に一致する記事は見つかりませんでした。</p>
        )}
        {articlesForCurrentPage.length === 0 && !searchQuery && (
          <p className={styles.infoMessage}>{currentDisplayingGenreName}の記事はまだありません。</p>
        )}
        {articlesForCurrentPage.length > 0 && (
          <ArticleList articles={articlesForCurrentPage} />
        )}

        {renderPaginationControls()}
        <RecommendedArticles articles={recommendedArticles} />
      </div>
    </>
  );
}

// ★ この行が重要です
export default Home;