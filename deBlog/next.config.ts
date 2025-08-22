import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@solana/wallet-adapter-react',
    '@solana/web3.js',
    '@project-serum/anchor',
  ],
}

export default nextConfig