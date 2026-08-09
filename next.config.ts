import type { NextConfig } from "next";

// Fail fast on missing critical env vars (DATABASE_URL, NEXTAUTH_SECRET) at build/boot time.
import "./src/lib/env";

const nextConfig: NextConfig = {

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), fullscreen=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io https://*.stripe.com https://source.zoom.us https://*.cloudinary.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.zoom.us https://*.sentry.io https://*.stripe.com https://*.supabase.co https://*.cloudinary.com wss:",
              "frame-src 'self' https://*.stripe.com https://source.zoom.us https://zoom.us https://www.youtube.com https://*.youtube.com https://player.vimeo.com",
              "media-src 'self' https: blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
