/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set basePath only in production
  basePath: process.env.NODE_ENV === 'production' ? '/deepseekchat' : '',
  experimental: {
    serverActions: {
      allowedOrigins: ["demo.exa.ai"],
      allowedForwardedHosts: ["demo.exa.ai"],
    },
  },
};

export default nextConfig;