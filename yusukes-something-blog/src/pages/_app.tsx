// src/pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout'; // 既存のLayoutコンポーネント
import { SessionProvider } from 'next-auth/react'; // SessionProviderをインポート

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}> {/* SessionProviderでラップ */}
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}

export default MyApp;