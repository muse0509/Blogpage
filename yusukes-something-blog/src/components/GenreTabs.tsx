// components/GenreTabs.tsx
import { useState } from 'react';
import { Genre } from '../../lib/dummyData'; // 型をインポート
import styles from './GenreTabs.module.css';

interface GenreTabsProps {
  genres: Genre[];
  onSelectGenre: (genreSlug: string) => void; // どのジャンルが選択されたか親に伝える
}

const GenreTabs = ({ genres, onSelectGenre }: GenreTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(genres[0]?.slug || 'all');

  const handleTabClick = (genreSlug: string) => {
    setActiveTab(genreSlug);
    onSelectGenre(genreSlug);
  };

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