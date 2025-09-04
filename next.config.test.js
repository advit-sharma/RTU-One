module.exports = {
  // Minimal configuration for testing
  reactStrictMode: true,
  swcMinify: true,
  // Disable all optimizations for testing
  optimizeFonts: false,
  compress: false,
  // Disable source maps for faster builds
  productionBrowserSourceMaps: false,
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
};
