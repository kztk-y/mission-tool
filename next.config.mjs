/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポートエラーを無視（Vercelでは正常動作）
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
