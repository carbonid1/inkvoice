/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'epub2',
      'kokoro-js',
      '@huggingface/transformers',
      'onnxruntime-node',
    ],
  },
}

export default nextConfig
