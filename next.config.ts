/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Garante ultra-performance e empacotamento simplificado e estático no Docker se necessário
  },
};

export default nextConfig;
