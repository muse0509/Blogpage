// components/ArticleCard.tsx
import Link from 'next/link';
import Image from 'next/image'; // Next.jsのImageコンポーネントを使用
import { Article } from '../../lib/dummyData';
import styles from './ArticleCard.module.css';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <Link href={`/posts/${article.slug}`} passHref>
      <div className={styles.card}>
        {article.imageUrl && (
          <div className={styles.imageContainer}>
            <Image
              src={article.imageUrl}
              alt={article.title}
              layout="fill" // 親要素にフィットさせる
              objectFit="cover" // アスペクト比を保ちつつカバー
              className={styles.image}
            />
          </div>
        )}
        <div className={styles.content}>
          <span className={styles.genre}>{article.genre}</span>
          <h3 className={styles.title}>{article.title}</h3>
          <p className={styles.excerpt}>{article.excerpt}</p>
          <time dateTime={article.date} className={styles.date}>
            {new Date(article.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;