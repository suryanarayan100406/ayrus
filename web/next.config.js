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
    ],
  },
}

module.exports = nextConfig
