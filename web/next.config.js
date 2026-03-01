/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'storage.googleapis.com',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'i.scdn.co',
      'imgjam1.jamendo.com',
      'imgjam2.jamendo.com',
      'archive.org',
      'localhost',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
      };

      // Ignore undici on the client side — it's a Node.js HTTP client
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig
