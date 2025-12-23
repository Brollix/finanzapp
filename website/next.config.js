/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true, // Optimize for Docker deployment
  },
}

module.exports = nextConfig

