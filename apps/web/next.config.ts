import type { NextConfig } from 'next'
import { loadEnvConfig } from '@next/env'
import { resolve } from 'node:path'
import { MARKETING_URLS } from './lib/marketing'

loadEnvConfig(resolve(__dirname, '../..'))
if (!process.env.PORT && process.env.WEB_PORT) {
  process.env.PORT = process.env.WEB_PORT
}

const nextConfig: NextConfig = {
  transpilePackages: ['@aib-sitac/core'],
  async redirects() {
    return [
      {
        source: '/privacy',
        destination: MARKETING_URLS.privacy,
        permanent: true,
      },
      {
        source: '/terms',
        destination: MARKETING_URLS.terms,
        permanent: true,
      },
    ]
  },
}

export default nextConfig
