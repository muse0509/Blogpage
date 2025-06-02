// src/components/GenreTabs.tsx
import { useState } from 'react';
import styles from './GenreTabs.module.css'; // CSSモジュールをインポート

// ★ GenreTabインターフェースをエクスポートする
export interface GenreTab {
  id: string;
  name: string;
  slug: string;
}

interface GenreTabsProps {
  genres: GenreTab[]; // GenreTab型を使用
  onSelectGenre: (genreSlug: string) => void;
}

const GenreTabs = ({ genres, onSelectGenre }: GenreTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(genres[0]?.slug || 'all');

  const handleTabClick = (genreSlug: string) => {
    setActiveTab(genreSlug);
    onSelectGenre(genreSlug);
  };

  if (!genres || genres.length === 0) {
    return null; // ジャンルがない場合は何も表示しないか、適切なUIを表示
  }

  return (
    <div className={styles.tabsContainer}>
      {genres.map((genre) => (
        <button
          key={genre.id}
          className={`${styles.tab} ${activeTab === genre.slug ? styles.active : ''}`}
          onClick={() => handleTabClick(genre.slug)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
};

export default GenreTabs;