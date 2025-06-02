// src/components/ArticleList.tsx
import ArticleCard, { ArticleForCard } from './ArticleCard'; // ★ ArticleForCard を ArticleCard からインポート
import styles from './ArticleList.module.css';

interface ArticleListProps {
  articles: ArticleForCard[]; // ★ articles プロパティの型を ArticleForCard[] に指定
}

const ArticleList = ({ articles }: ArticleListProps) => {
  if (!articles || articles.length === 0) {
    return <p className={styles.noArticles}>表示できる記事はありません。</p>;
  }
  return (
    <div className={styles.list}>
      {articles.map((article) => (
        // ここで渡される article は ArticleForCard 型を満たしている必要がある
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default ArticleList;