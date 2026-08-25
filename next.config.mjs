/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@google/genai', 'xero-node', 'express'],
  devIndicators: false,
};

export default nextConfig;



