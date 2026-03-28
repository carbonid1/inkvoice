/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['epub2'],
    outputFileTracingIncludes: {
      '/**': ['./generated/prisma/**', './node_modules/.prisma/**'],
    },
  },
}

export default nextConfig
