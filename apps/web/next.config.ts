import type { NextConfig } from 'next'
import { loadEnvConfig } from '@next/env'
import { resolve } from 'node:path'

loadEnvConfig(resolve(__dirname, '../..'))
if (!process.env.PORT && process.env.WEB_PORT) {
  process.env.PORT = process.env.WEB_PORT
}

const nextConfig: NextConfig = {
  transpilePackages: ['@aib-sitac/core'],
}

export default nextConfig
