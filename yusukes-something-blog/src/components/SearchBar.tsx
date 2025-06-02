// src/components/SearchBar.tsx
import { useState, FormEvent, ChangeEvent } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.searchContainer}>
      <input
        type="search"
        placeholder="サイト内を検索..."
        value={query}
        onChange={handleInputChange}
        className={styles.searchInput}
      />
      <button type="submit" className={styles.searchButton}>
        検索
      </button>
    </form>
  );
};

export default SearchBar;