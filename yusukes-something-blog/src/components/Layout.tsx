// src/components/Layout.tsx
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image'; // ロゴ用
import styles from './Layout.module.css';
import { useSession, signIn, signOut } from 'next-auth/react';

interface LayoutProps {
  children: React.ReactNode;
}

const siteTitleConst = "Yusuke's SomeThing";
const YOUR_X_PROFILE_URL = "https://twitter.com/yusuke_05092005"; // ★ あなたのXプロフィールのURLに置き換えてください

const Layout = ({ children }: LayoutProps) => {
  const { data: session, status } = useSession();

  return (
    <div className={styles.container}>
      <Head>
        <meta name="description" content="Yusuke's personal blog for reading records and thoughts." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <Link href="/" passHref>
          <div className={styles.logoContainer}>
            <Image
              src="/logo.png" // public/logo.png を想定
              alt={siteTitleConst}
              width={180}
              height={70}
              priority
              className={styles.logoImage}
            />
          </div>
        </Link>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/disclaimer" className={styles.footerLinkItem}>
            免責事項
          </Link>
          <span className={styles.footerLinkSeparator}>|</span>
          <Link href="/privacy-policy" className={styles.footerLinkItem}>
            プライバシーポリシー
          </Link>
          {/* ▼▼▼ Xへのリンクを追加 ▼▼▼ */}
          <span className={styles.footerLinkSeparator}>|</span>
          <a href={YOUR_X_PROFILE_URL} target="_blank" rel="noopener noreferrer" className={styles.footerLinkItem} title="Xプロフィール">
            <svg className={styles.socialIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M18.2048 2.25H21.5128L14.2858 10.51L22.7878 21.75H16.1308L10.9168 14.932L4.94983 21.75H1.64083L9.30483 12.979L1.22183 2.25H8.05383L12.7918 8.507L18.2048 2.25ZM17.0438 19.77H18.8358L7.40683 4.126H5.49783L17.0438 19.77Z"></path>
            </svg>
            <span className={styles.socialIconText}></span>
          </a>
          {/* ▲▲▲ Xへのリンクを追加 ▲▲▲ */}
        </div>
        <p className={styles.copyright}>© {new Date().getFullYear()} {siteTitleConst}</p>
      </footer>
    </div>
  );
};

export default Layout;