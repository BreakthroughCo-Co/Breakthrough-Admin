/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost',
    '*.run.app',
    '*.googleusercontent.com',
    'ais-dev-fvcq32sizwox6fa7chplbk-322108119867.asia-southeast1.run.app',
    'ais-pre-fvcq32sizwox6fa7chplbk-322108119867.asia-southeast1.run.app'
  ],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@google/genai', 'xero-node'],
};

export default nextConfig;



