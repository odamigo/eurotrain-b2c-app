import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================
  // API PROXY (Backend'e yönlendirme)
  // ============================================
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
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

export default nextConfig;
