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
      // ▼▼▼ このオブジェクトがあなたのSupabase Storageを許可します ▼▼▼
      {
        protocol: 'https',
        hostname: 'ntflzhcnpdugnpfvlokd.supabase.co', // ★ あなたのホスト名をここに設定
        port: '',
        pathname: '/storage/v1/object/public/**', // バケット内のすべての公開オブジェクトを許可
      },
      // ▲▲▲ このオブジェクトがあなたのSupabase Storageを許可します ▲▲▲
    ],
  },

  transpilePackages: [
    '@uiw/react-md-editor',
    '@uiw/react-markdown-preview',
  ],

  webpack: (
    config: WebpackConfiguration,
    { isServer }
  ): WebpackConfiguration => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        dns: false,
        net: false,
        tls: false,
        fs: false,
        http2: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;