/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',   // 靜態 HTML 輸出，Vercel 零設定部署
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
