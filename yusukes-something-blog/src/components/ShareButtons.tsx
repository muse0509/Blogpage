// src/components/ShareButtons.tsx
import { useState, useEffect } from 'react';
import styles from './ShareButtons.module.css';

interface ShareButtonsProps {
  title: string;
  url: string; // 現在のページのURL
}

const ShareButtons = ({ title, url }: ShareButtonsProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // クライアントサイドでのみ window.location.href を取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [url]); // url prop が変わった場合も追従 (ただし通常は router.asPath で更新されるべき)

  const handleCopyLink = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
      alert('リンクのコピーに失敗しました。');
    }
  };

  if (!currentUrl) { // URLが確定するまでは何も表示しないか、ローディング表示
    return null;
  }

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;

  return (
    <div className={styles.shareContainer}>
      <button onClick={handleCopyLink} className={styles.shareButton} title="リンクをコピー">
        {isCopied ? 'コピー完了!' : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M13.0001 10.0001L13.0001 6.00006L12.948 6.05309C12.6119 6.40716 12.0789 6.42097 11.7249 6.08495C11.3708 5.74892 11.357 5.21592 11.7011 4.86185L11.7531 4.79991L15.2532 1.2998L15.3151 1.23786C15.6592 0.883791 16.1922 0.870005 16.5462 1.19205L16.6097 1.23786L22.7624 7.39055L22.8242 7.45399C23.1325 7.78678 23.1609 8.28917 22.9016 8.64858L22.8242 8.7297L16.6714 14.8824L16.6096 14.9443C16.2736 15.2984 15.7406 15.3122 15.3865 14.9901L15.3231 14.9443L13.0001 12.6213L13.0001 10.0001ZM11.0001 11.0001L11.0001 14.0001L4.00006 14.0001C2.89549 14.0001 2.00006 14.8955 2.00006 16.0001L2.00006 20.0001C2.00006 21.1046 2.89549 22.0001 4.00006 22.0001L10.0001 22.0001C11.1046 22.0001 12.0001 21.1046 12.0001 20.0001L12.0001 18.0001H10.0001L10.0001 20.0001L4.00006 20.0001L4.00006 16.0001L11.0001 16.0001L11.0001 11.0001Z"></path>
          </svg>
        )}
        <span className={styles.buttonText}>{isCopied ? '' : 'コピー'}</span>
      </button>
      <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className={`${styles.shareButton} ${styles.twitterButton}`} title="Xで共有">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M18.2048 2.25H21.5128L14.2858 10.51L22.7878 21.75H16.1308L10.9168 14.932L4.94983 21.75H1.64083L9.30483 12.979L1.22183 2.25H8.05383L12.7918 8.507L18.2048 2.25ZM17.0438 19.77H18.8358L7.40683 4.126H5.49783L17.0438 19.77Z"></path>
        </svg>
        <span className={styles.buttonText}>で共有</span>
      </a>
    </div>
  );
};

export default ShareButtons;