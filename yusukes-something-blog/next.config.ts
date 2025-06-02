// next.config.ts
import { NextConfig } from 'next';
import { Configuration as WebpackConfiguration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      // 他のドメイン設定など
    ],
  },

  // ★★★ 問題のあるパッケージをトランスパイル対象に追加 ★★★
  transpilePackages: [
    '@uiw/react-md-editor',
    '@uiw/react-markdown-preview',
    // もしエラーメッセージに他の @uiw/* や関連ライブラリの名前が出てくるようであれば、
    // それらもここに追加する必要があるかもしれません。
    // 例えば、@uiw/react-markdown-preview が依存している @uiw/react-code-preview なども
    // 問題を起こす可能性がありますが、まずは上記2つで試します。
  ],

  webpack: (
    config: WebpackConfiguration,
    { isServer, webpack } // 'webpack' インスタンスは必要に応じて型付け
  ): WebpackConfiguration => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        dns: false,
        net: false,
        tls: false,
        fs: false,
        http2: false, // 前回のログに合わせて追加済み
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig; // ★ CommonJS形式からES Modules形式のエクスポートに変更