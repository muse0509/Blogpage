// next.config.js または next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 他の設定があればそのまま残してください
  images: {
    domains: ['via.placeholder.com'], // ここに許可するホスト名を追加
  },
};

module.exports = nextConfig;

// もしESM (next.config.mjs) を使っている場合
// export default nextConfig;