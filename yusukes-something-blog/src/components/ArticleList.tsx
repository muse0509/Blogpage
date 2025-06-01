// components/ArticleList.tsx
import { Article } from '../../lib/dummyData';
import ArticleCard from './ArticleCard';
import styles from './ArticleList.module.css';

interface ArticleListProps {
  articles: Article[];
}

const ArticleList = ({ articles }: ArticleListProps) => {
  if (articles.length === 0) {
    return <p className={styles.noArticles}>該当する記事はありません。</p>;
  }
  return (
    <div className={styles.list}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default ArticleList;