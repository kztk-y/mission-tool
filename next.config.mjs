/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSGを無効化し、全ページを動的レンダリングに
  // これによりRadix UI + React 18の互換性問題を回避
  output: 'standalone',
};

export default nextConfig;
