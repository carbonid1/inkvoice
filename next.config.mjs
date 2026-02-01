/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['epub2'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore the optional 'zipfile' native module in epub2
      config.resolve.alias['zipfile'] = false
    }
    return config
  },
}

export default nextConfig
