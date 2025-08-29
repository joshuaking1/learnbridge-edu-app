import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ❗ Skips ESLint during `next build`, even if there are errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Skip type errors during production builds
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase body size limit to 10MB
    },
  },
};

export default nextConfig;
