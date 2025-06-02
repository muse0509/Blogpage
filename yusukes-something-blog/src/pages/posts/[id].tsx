// src/pages/posts/[id].tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid'; // uuid をインポート

// ArticleData型をAPIルートまたは共通の型定義ファイルからインポートすることを想定
// ここでは ../../api/admin/articles.ts からインポートする例
import type { ArticleData as Article } from '../../api/admin/articles';
// ArticleCard用の型もインポート
import ArticleCard, { ArticleForCard } from '../../components/ArticleCard';

import BackToTopButton from '../../components/BackToTopButton';
import ShareButtons from '../../components/ShareButtons';

import styles from '../../styles/PostPage.module.css';

interface PostPageProps {
  article: Article | null;
  relatedArticles?: ArticleForCard[]; // 「他の記事を読む」セクション用
  error?: string;
}

// 匿名ユーザーIDを取得または生成する関数
const getAnonymousUserId = (): string => {
  if (typeof window === 'undefined') return ''; // SSR時は何もしない
  let userId = localStorage.getItem('anonymousUserId');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('anonymousUserId', userId);
  }
  return userId;
};

export const getServerSideProps: GetServerSideProps<PostPageProps> = async (context) => {
  const fs = require('fs/promises'); // getServerSideProps内でのみrequire
  const path = require('path');     // getServerSideProps内でのみrequire
  const articlesFilePath_ssr = path.join(process.cwd(), 'data', 'articles.json');

  // 配列をシャッフルするヘルパー関数 (Fisher-Yates shuffle)
  const shuffle = <T,>(array: T[]): T[] => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
  };

  const { params } = context;
  const articleId = params?.id as string;

  if (!articleId) {
    return { props: { article: null, relatedArticles: [], error: '記事IDが見つかりません。' } };
  }

  try {
    let allArticles: Article[] = [];
    try {
        const fileData = await fs.readFile(articlesFilePath_ssr, 'utf-8');
        if (fileData) {
            allArticles = JSON.parse(fileData);
        }
    } catch (e) {
        console.warn("getServerSideProps: Could not read articles.json or it was empty.", e);
    }

    const currentArticle = allArticles.find(art => art.id === articleId);

    if (!currentArticle) {
      return { props: { article: null, relatedArticles: [], error: '指定された記事は見つかりませんでした。' } };
    }

    if (!currentArticle.published) {
      // 公開されていない記事の場合 (必要に応じてプレビューロジックなどを追加)
      return { props: { article: null, relatedArticles: [], error: 'この記事は現在公開されていません。' } };
    }

    // 同じジャンルの他の公開記事を取得
    const articlesInSameGenre = allArticles.filter(
      art =>
        art.id !== currentArticle.id &&
        art.published &&
        art.genre === currentArticle.genre
    );

    const shuffledRelatedArticles = shuffle(articlesInSameGenre);
    const selectedRelatedArticles = shuffledRelatedArticles.slice(0, 3); // 最大3件表示

    const relatedArticlesData: ArticleForCard[] = selectedRelatedArticles.map(art => ({
      id: art.id,
      title: art.title,
      genre: art.genre,
      content: art.content, // ArticleCardで抜粋生成のため
      updatedAt: art.updatedAt,
      createdAt: art.createdAt, // ArticleForCardの型定義に合わせて
      slug: art.slug || null,   // APIにslugがあれば。なければnull
      thumbnailUrl: art.thumbnailUrl || null,
      likeCount: art.likeCount || 0, // いいね数も渡す
    }));

    return { props: { article: currentArticle, relatedArticles: relatedArticlesData } };

  } catch (error) {
    console.error('Error fetching article for SSR in [id].tsx:', error);
    return { props: { article: null, relatedArticles: [], error: '記事の読み込み中にサーバー側でエラーが発生しました。' } };
  }
};


const PostPage: NextPage<PostPageProps> = ({ article, relatedArticles, error }) => {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState('');

  // いいね機能用のstate
  const [likeCount, setLikeCount] = useState(0); // 初期値は0、articleがあればuseEffectで更新
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [anonymousUserId, setAnonymousUserId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      const userId = getAnonymousUserId();
      setAnonymousUserId(userId);

      if (article) {
        // likeCountの初期値をサーバーから取得した値で設定
        setLikeCount(article.likeCount || 0);
        // localStorageから「この記事をこの匿名IDがいいねしたか」を読み込む
        const likedArticlesByAnon = JSON.parse(localStorage.getItem(`liked_articles_${userId}`) || '{}');
        if (likedArticlesByAnon[article.id]) {
          setHasLiked(true);
        } else {
          setHasLiked(false);
        }
      }
    }
  }, [router.asPath, article]); // articleも依存配列に追加

  // いいねボタンクリック時の処理
  const handleLikeClick = async () => {
    if (!article || !anonymousUserId || isLiking) return;

    setIsLiking(true);

    try {
      const response = await fetch(`/api/like/${article.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anonymousUserId }),
      });
      const result = await response.json();

      if (response.ok) {
        setLikeCount(result.likeCount);
        if (result.message === 'Like registered successfully!') {
          setHasLiked(true);
          const likedArticlesByAnon = JSON.parse(localStorage.getItem(`liked_articles_${anonymousUserId}`) || '{}');
          likedArticlesByAnon[article.id] = true;
          localStorage.setItem(`liked_articles_${anonymousUserId}`, JSON.stringify(likedArticlesByAnon));
        } else if (result.message === 'Already liked.') {
          setHasLiked(true); // UIもいいね済み状態を維持
        }
      } else {
        console.error('いいねの登録に失敗しました:', result.error);
        alert(`いいねの登録に失敗しました: ${result.error || 'サーバーエラー'}`);
      }
    } catch (err) {
      console.error('いいね処理中にエラー:', err);
      alert('いいね処理中に通信エラーが発生しました。');
    } finally {
      setIsLiking(false);
    }
  };

  const BackToListLinkComponent = () => (
    <div className={styles.backToListWrapper}>
      <Link href="/" className={styles.backToListStyledLink}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" style={{ marginRight: '0.5em', verticalAlign: 'middle' }}>
          <path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z"></path>
        </svg>
        ブログ一覧へ戻る
      </Link>
    </div>
  );

  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <p className={styles.error}>{error}</p>
          <BackToListLinkComponent />
        </div>
      </div>
    );
  }

  if (!article) {
    // このケースはgetServerSidePropsでエラーとして処理されるか、notFound: trueで404になるため、
    // 通常ここには到達しにくいですが、念のため。
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <p>記事が見つかりませんでした。</p>
          <BackToListLinkComponent />
        </div>
      </div>
    );
  }

  const articleContent = article.content || '';
  const excerpt = articleContent.substring(0, 160) + (articleContent.length > 160 ? '...' : '');

  return (
    <>
      <Head>
        <title>{article.title} | Yusuke's SomeThing</title>
        <meta name="description" content={excerpt} />
        {article.thumbnailUrl && <meta property="og:image" content={article.thumbnailUrl} />}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:type" content="article" />
        {currentUrl && <meta property="og:url" content={currentUrl} />}
      </Head>
      <BackToTopButton />
      <div className={styles.pageWrapper}>
        <article className={styles.container}>
          <div className={styles.articleHeader}>
            <BackToListLinkComponent />
            <h1 className={styles.title}>{article.title}</h1>
            <div className={styles.meta}>
              <span>ジャンル: {article.genre}</span>
              <span>最終更新日: {new Date(article.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            {currentUrl && <ShareButtons title={article.title} url={currentUrl} /> }
          </div>

          <div className={styles.actionsContainer}>
            <button
              onClick={handleLikeClick}
              disabled={isLiking || !anonymousUserId}
              className={`${styles.likeButton} ${hasLiked ? styles.liked : ''} ${isLiking ? styles.liking : ''}`}
              title={hasLiked ? "いいね済み" : "いいね！"}
            >
              <svg
                className={styles.likeIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="1.3em"
                height="1.3em"
              >
                <path
                  d="M12.001 4.52853C10.0482 2.32024 6.69908 2.49708 4.70027 4.84007C2.70145 7.18305 2.8689 10.7071 4.70027 12.8113L11.9992 20.8333L19.2991 12.8113C21.1305 10.7071 21.298 7.18305 19.2991 4.84007C17.3003 2.49708 13.9512 2.32024 12.001 4.52853Z"
                  stroke={hasLiked ? "var(--color-accent)" : "currentColor"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={hasLiked ? "var(--color-accent)" : "none"}
                />
              </svg>
              <span className={styles.likeButtonText}>
                {isLiking ? '処理中...' : (hasLiked ? 'いいね済み' : 'いいね！')}
              </span>
            </button>
            <span className={styles.likeCount}>{likeCount} いいね</span>
          </div>

          {article.thumbnailUrl && (
            <div className={styles.thumbnailContainer}>
              <Image
                src={article.thumbnailUrl}
                alt={article.title}
                width={800}
                height={450}
                style={{ objectFit: 'cover', borderRadius: '8px', width: '100%', height: 'auto' }}
                priority
              />
            </div>
          )}

          <div className={styles.content}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]} // remarkOembed は削除済み
            >
              {articleContent}
            </ReactMarkdown>
          </div>

          <section className={styles.relatedPostsSection}>
            <h2 className={styles.relatedPostsTitle}>同じジャンルの他の記事</h2>
            {relatedArticles && relatedArticles.length > 0 ? (
              <div className={styles.relatedPostsGrid}>
                {relatedArticles.map(relatedArt => (
                  <ArticleCard key={relatedArt.id} article={relatedArt} />
                ))}
              </div>
            ) : (
              <p>同じジャンルの他の記事は現在ありません。</p>
            )}
            <BackToListLinkComponent />
          </section>
        </article>
      </div>
    </>
  );
};

export default PostPage;