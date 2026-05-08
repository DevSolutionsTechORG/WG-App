import type { NextConfig } from 'next'
import { fileURLToPath } from 'url'
import path from 'path'
import { withPayload } from '@payloadcms/next/withPayload'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === 'development'

const baseSecurityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  ...(isDev
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]),
]

const appCsp = [
  "default-src 'self'",
  // Tailwind/shadcn use CSS variables; some Next.js inline styles still need 'unsafe-inline'.
  "style-src 'self' 'unsafe-inline'",
  // Next.js inline scripts (RSC payload) require 'unsafe-inline'. In dev, eval is needed for HMR.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

// Payload admin uses inline scripts/styles and eval-like patterns; keep it permissive but scoped.
const adminCsp = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  transpilePackages: ['react-big-calendar'],
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          ...baseSecurityHeaders,
          { key: 'Content-Security-Policy', value: adminCsp },
        ],
      },
      {
        source: '/((?!admin|api).*)',
        headers: [
          ...baseSecurityHeaders,
          { key: 'Content-Security-Policy', value: appCsp },
        ],
      },
      {
        source: '/api/:path*',
        headers: baseSecurityHeaders,
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

export default withPWA(withPayload(nextConfig, { devBundleServerPackages: false }))
