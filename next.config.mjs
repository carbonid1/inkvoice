import { execSync } from 'child_process'

const gitCommit = execSync('git rev-parse --short HEAD').toString().trim()
const gitMessage = execSync('git log -1 --format=%s').toString().trim()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // portless prefixes the hostname with the git branch in worktrees
  // (e.g. alignment.inkvoice.localhost), so allow the whole subdomain space.
  allowedDevOrigins: ['*.inkvoice.localhost'],
  transpilePackages: ['@carbonid1/design-system'],
  serverExternalPackages: ['epub2'],
  outputFileTracingIncludes: {
    '/**': ['./generated/prisma/**', './node_modules/.prisma/**'],
  },
  env: {
    NEXT_PUBLIC_GIT_COMMIT: gitCommit,
    NEXT_PUBLIC_GIT_MESSAGE: gitMessage,
  },
}

export default nextConfig
