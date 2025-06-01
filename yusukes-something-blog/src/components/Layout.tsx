// components/Layout.tsx （修正後）
import Head from 'next/head';
import Link from 'next/link';
import styles from './Layout.module.css';

type LayoutProps = {
  children: React.ReactNode;
};

const siteTitle = "Yusuke's SomeThing";

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className={styles.container}>
      <Head>
        {/* サイト全体の共通Head情報をここに記述 */}
        <meta name="description" content="Yusuke's personal blog for reading records and thoughts." />
        <link rel="icon" href="/favicon.ico" />
        {/* title は各ページで設定 */}
      </Head>

      {/* ... (header, main, footer は変更なし) ... */}
      <header className={styles.header}>
        <Link href="/" passHref>
          <div className={styles.siteTitle}>{siteTitle}</div>
        </Link>
        <nav className={styles.nav}>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} {siteTitle}</p>
      </footer>
    </div>
  );
};

export default Layout;