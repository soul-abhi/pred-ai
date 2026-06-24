import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow cross-origin API calls in dev
  async rewrites() {
    return [];
  },
};

export default nextConfig;
