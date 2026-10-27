import type { NextConfig } from 'next'
import { loadEnvConfig } from '@next/env'
import { resolve } from 'node:path'

loadEnvConfig(resolve(__dirname, '../..'))

const nextConfig: NextConfig = {
  transpilePackages: ['@aib-sitac/core'],
  webpack: config => {
    if (process.env.WATCHPACK_POLLING) {
      config.watchOptions = {
        poll: Number(process.env.WATCHPACK_POLLING) || 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

export default nextConfig
