// src/components/ArticleCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import styles from './ArticleCard.module.css';

export interface ArticleForCard {
  id: string;
  title: string;
  genre: string;
  updatedAt: string;
  content?: string;
  slug?: string;
  thumbnailUrl?: string;
}

interface ArticleCardProps {
  article: ArticleForCard;
}

// ★ マークダウンをプレーンテキストに近づける簡単なヘルパー関数
const markdownToPlainText = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/^#+\s+/gm, '') // 見出し記号 (## など) を除去
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // 太字 (*word* や __word__) を内容のみに
    .replace(/(\*|_)(.*?)\1/g, '$2')   // イタリック (*word* や _word_) を内容のみに
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // 画像 ![alt](url) をaltテキストに (または空文字に)
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // リンク [text](url) をtextに
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // インラインコードやコードブロックを内容のみに
    .replace(/\n+/g, ' ') // 複数の改行をスペースに
    .replace(/>\s+/g, '') // 引用の > を除去
    .replace(/-\s+/g, '') // リストの - を除去
    .replace(/\s{2,}/g, ' ') // 連続するスペースを1つに
    .trim();
};

const ArticleCard = ({ article }: ArticleCardProps) => {
  const plainTextContent = markdownToPlainText(article.content || '');
  const excerpt =
    plainTextContent.length > 80
      ? plainTextContent.substring(0, 80) + '...'
      : plainTextContent;

  const linkHref = article.slug ? `/posts/${article.slug}` : `/posts/${article.id}`;

  return (
    <Link href={linkHref} passHref>
      <div className={styles.card}>
        {article.thumbnailUrl ? (
          <div className={styles.imageContainer}>
            <Image
              src={article.thumbnailUrl}
              alt={article.title}
              fill
              style={{ objectFit: 'cover' }}
              className={styles.image}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          </div>
        ) : (
          <div className={`${styles.imageContainer} ${styles.noImagePlaceholder}`}>
            <span>No Image</span>
          </div>
        )}
        <div className={styles.content}>
          <span className={styles.genre}>{article.genre}</span>
          <h3 className={styles.title}>{article.title}</h3>
          {/* ★ プレーンテキスト化された抜粋を表示 */}
          {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
          <time dateTime={article.updatedAt} className={styles.date}>
            {new Date(article.updatedAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;