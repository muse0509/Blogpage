// src/pages/posts/[id].tsx
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';

import { supabaseAdmin } from '../../lib/supabaseClient';
// 共通の型定義ファイルからのインポートを推奨
import type { Article } from '../../types'; 
import ArticleCard from '../../components/ArticleCard';
import type { ArticleForCard } from '../../components/ArticleCard';

import BackToTopButton from '../../components/BackToTopButton';
import ShareButtons from '../../components/ShareButtons';

import styles from '../../styles/PostPage.module.css';

interface PostPageProps {
  article: Article | null;
  relatedArticles?: ArticleForCard[];
  error?: string;
}

// 匿名ユーザーIDを取得または生成する関数
const getAnonymousUserId = (): string => {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('anonymousUserId');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('anonymousUserId', userId);
  }
  return userId;
};

export const getServerSideProps: GetServerSideProps<PostPageProps> = async (context) => {
  const { params } = context;
  const articleId = params?.id as string;

  if (!articleId) {
    return { props: { article: null, relatedArticles: [], error: '記事IDが見つかりません。' } };
  }

  try {
    const { data: currentArticle, error: currentArticleError } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (currentArticleError) {
      if (currentArticleError.code === 'PGRST116') { // データが見つからない場合のエラーコード
        return { props: { article: null, relatedArticles: [], error: '指定された記事は見つかりませんでした。' } };
      }
      throw currentArticleError; // その他のDBエラー
    }

    if (!currentArticle) {
      return { props: { article: null, relatedArticles: [], error: '指定された記事は見つかりませんでした。' } };
    }

    if (!currentArticle.published) {
      return { props: { article: null, relatedArticles: [], error: 'この記事は現在公開されていません。' } };
    }

    const { data: relatedArticlesData, error: relatedArticlesError } = await supabaseAdmin
      .from('articles')
      .select('id, title, genre, content, updated_at, created_at, slug, thumbnail_url, like_count')
      .eq('genre', currentArticle.genre)
      .neq('id', currentArticle.id)
      .eq('published', true)
      .limit(10);

    if (relatedArticlesError) {
      console.error('Supabase error fetching related articles:', relatedArticlesError);
    }
    
    const shuffle = <T,>(array: T[]): T[] => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };
    const shuffledRelatedArticles = shuffle(relatedArticlesData || []);
    const selectedRelatedArticles = shuffledRelatedArticles.slice(0, 3);
    
    const articlesForCard: ArticleForCard[] = selectedRelatedArticles.map(art => ({
      id: art.id,
      title: art.title,
      genre: art.genre,
      content: art.content || '',
      updatedAt: art.updated_at || '',
      createdAt: art.created_at || '',
      slug: art.slug || null, // undefinedの代わりにnullを使用
      thumbnailUrl: art.thumbnail_url || null, // undefinedの代わりにnullを使用
      likeCount: art.like_count || 0,
    }));

    const finalArticleProps: Article = {
      id: currentArticle.id,
      title: currentArticle.title,
      genre: currentArticle.genre,
      content: currentArticle.content,
      published: currentArticle.published,
      createdAt: currentArticle.created_at || '',
      updatedAt: currentArticle.updated_at || '',
      slug: currentArticle.slug || null, // undefinedの代わりにnullを使用
      thumbnailUrl: currentArticle.thumbnail_url || null, // undefinedの代わりにnullを使用
      likeCount: currentArticle.like_count || 0,
    };

    return { props: { article: finalArticleProps, relatedArticles: articlesForCard } };

  } catch (error: any) {
    console.error('Error in getServerSideProps for [id].tsx:', error);
    return { props: { article: null, relatedArticles: [], error: `記事の読み込み中にエラーが発生しました: ${error.message}` } };
  }
};


const PostPage: NextPage<PostPageProps> = ({ article, relatedArticles, error }) => {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [anonymousUserId, setAnonymousUserId] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [displayContent, setDisplayContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      const userId = getAnonymousUserId();
      setAnonymousUserId(userId);

      if (article) {
        setLikeCount(article.likeCount || 0);
        const likedArticlesByAnon = JSON.parse(localStorage.getItem(`liked_articles_${userId}`) || '{}');
        setHasLiked(!!likedArticlesByAnon[article.id]);
        
        const content = article.content || '';
        setOriginalContent(content);
        setDisplayContent(content);
        setIsTranslated(false);
        setTranslationError(null);
      }
    }
  }, [router.asPath, article]);

  const handleLikeClick = async () => {
    if (!article || !anonymousUserId || isLiking || hasLiked) return;
    setIsLiking(true);
    try {
      const response = await fetch(`/api/like/${article.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          setHasLiked(true);
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

  const handleTranslateClick = async () => {
    if (!article) return;
    if (isTranslated) {
      setDisplayContent(originalContent);
      setIsTranslated(false);
      setTranslationError(null);
      return;
    }
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalContent, targetLanguage: 'en' }),
      });
      const result = await response.json();
      if (response.ok && result.translatedText) {
        setDisplayContent(result.translatedText);
        setIsTranslated(true);
      } else {
        throw new Error(result.error || 'Translation failed.');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setTranslationError(err.message || 'An unknown error occurred during translation.');
      setDisplayContent(originalContent);
      setIsTranslated(false);
    } finally {
      setIsTranslating(false);
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
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <p>記事が見つかりませんでした。</p>
          <BackToListLinkComponent />
        </div>
      </div>
    );
  }

  const excerpt = (originalContent || '').substring(0, 160) + ((originalContent || '').length > 160 ? '...' : '');

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
              disabled={hasLiked || isLiking || !anonymousUserId}
              className={`${styles.likeButton} ${hasLiked ? styles.liked : ''} ${isLiking ? styles.liking : ''}`}
              title={hasLiked ? "いいね済み" : "いいね！"}
            >
              <svg className={styles.likeIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.3em" height="1.3em" >
                <path d="M12.001 4.52853C10.0482 2.32024 6.69908 2.49708 4.70027 4.84007C2.70145 7.18305 2.8689 10.7071 4.70027 12.8113L11.9992 20.8333L19.2991 12.8113C21.1305 10.7071 21.298 7.18305 19.2991 4.84007C17.3003 2.49708 13.9512 2.32024 12.001 4.52853Z"
                  stroke={hasLiked ? "var(--color-accent)" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={hasLiked ? "var(--color-accent)" : "none"} />
              </svg>
              <span className={styles.likeButtonText}>
                {isLiking ? '処理中...' : (hasLiked ? 'いいね済み' : 'いいね！')}
              </span>
            </button>
            <span className={styles.likeCount}>{likeCount} いいね</span>
            <button
              onClick={handleTranslateClick}
              disabled={isTranslating}
              className={styles.translateButton}
            >
              {isTranslating ? 'Translating...' : (isTranslated ? 'View Original (Japanese)' : '英語に翻訳')}
            </button>
          </div>
          {translationError && <p className={styles.errorMessageInline}>{translationError}</p>}
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
              remarkPlugins={[remarkGfm]}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
          <section className={styles.relatedPostsSection}>
            <h2 className={styles.relatedPostsTitle}>同じジャンルの他の記事</h2>
            {relatedArticles && relatedArticles.length > 0 ? (
              <div className={styles.relatedPostsGrid}>
                {relatedArticles.map(relatedArt => ( <ArticleCard key={relatedArt.id} article={relatedArt} /> ))}
              </div>
            ) : ( <p>同じジャンルの他の記事は現在ありません。</p> )}
            <BackToListLinkComponent />
          </section>
        </article>
      </div>
    </>
  );
};

export default PostPage;