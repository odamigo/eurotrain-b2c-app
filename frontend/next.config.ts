import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================
  // API PROXY (Backend'e yönlendirme)
  // ============================================
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        // NextAuth HARİÇ - /api/auth/* frontend'de kalacak
        // Sadece diğer backend API'leri proxy'le
        source: '/era/:path*',
        destination: `${apiUrl}/era/:path*`,
      },
      {
        source: '/bookings/:path*',
        destination: `${apiUrl}/bookings/:path*`,
      },
      {
        source: '/payment/:path*',
        destination: `${apiUrl}/payment/:path*`,
      },
      {
        source: '/my-trips/:path*',
        destination: `${apiUrl}/my-trips/:path*`,
      },
      {
        source: '/pdf/:path*',
        destination: `${apiUrl}/pdf/:path*`,
      },
      {
        source: '/calendar/:path*',
        destination: `${apiUrl}/calendar/:path*`,
      },
      {
        source: '/share/:path*',
        destination: `${apiUrl}/share/:path*`,
      },
      {
        source: '/settings/:path*',
        destination: `${apiUrl}/settings/:path*`,
      },
      {
        source: '/health',
        destination: `${apiUrl}/health`,
      },
    ];
  },

  // ============================================
  // GÜVENLİK BAŞLIKLARI
  // ============================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // ============================================
  // IMAGE OPTİMİZASYONU
  // ============================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eurotrain.net',
      },
      {
        protocol: 'https',
        hostname: '*.eurotrain.net',
      },
      {
        // Google profil resimleri için
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // ============================================
  // PRODUCTION OPTİMİZASYONLARI
  // ============================================
  // Powered by header'ı kaldır (güvenlik)
  poweredByHeader: false,

  // Strict mode
  reactStrictMode: true,

  // Output standalone (Docker için optimize)
  output: 'standalone',
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options
  org: "odamigo",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
