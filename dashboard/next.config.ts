import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to avoid false detection from parent lockfiles
    root: path.resolve(__dirname),
  },
}

export default nextConfig
