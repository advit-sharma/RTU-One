import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imljzgcuelzzzncfzlnc.supabase.co",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Enable more verbose logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Disable static optimization for easier debugging
  output: 'standalone',
  // Disable server components for now to isolate the issue
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Enable source maps for better error messages
  productionBrowserSourceMaps: true,
};

// Debug configuration
console.log('Next.js config loaded with the following settings:', JSON.stringify(nextConfig, null, 2));

export default nextConfig;