// components/SearchBar.tsx
import styles from './SearchBar.module.css';

const SearchBar = () => {
  return (
    <div className={styles.searchContainer}>
      <input type="search" placeholder="サイト内を検索..." className={styles.searchInput} />
      <button type="submit" className={styles.searchButton}>検索</button>
    </div>
  );
};

export default SearchBar;