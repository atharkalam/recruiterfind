import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Allow images from LinkedIn CDN
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.licdn.com' },
      { protocol: 'https', hostname: 'media.licdn.com' },
    ],
  },
};

export default nextConfig;
