/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['epub2'],
  outputFileTracingIncludes: {
    '/**': ['./generated/prisma/**', './node_modules/.prisma/**'],
  },
}

export default nextConfig
