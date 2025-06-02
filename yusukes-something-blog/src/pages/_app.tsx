// src/pages/_app.tsx
import '../styles/globals.css'; // 既存のグローバルCSS
import '@uiw/react-md-editor/markdown-editor.css';    // ★ MDEditorの基本スタイル
import '@uiw/react-markdown-preview/markdown.css'; // ★ Markdownプレビューの基本スタイル
// (もし上記パスが正確でない場合、node_modules内の実際のパスを確認してください)

import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import { SessionProvider } from 'next-auth/react';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}

export default MyApp;