// next.config.js (または next.config.ts)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...既存の設定 (reactStrictMode, images, transpilePackages など)...

  webpack: (config, { isServer }) => {
    // クライアントサイドのバンドルでのみ 'dns' モジュールを解決しないようにする
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // 既存のフォールバック設定を保持
        dns: false, // 'dns' を無視
        net: false, // 'net' も同様の問題を起こす可能性があるため追加
        tls: false, // 'tls' も同様
        fs: false,  // もし 'fs' で同様のエラーが出たら追加
      };
    }
    return config;
  },
};

module.exports = nextConfig; // もしESMなら export default nextConfig;