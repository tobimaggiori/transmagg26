/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-pg",
      "pg",
      "pdfkit",
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pg y sus dependencias nativas no deben resolverse en el client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        pg: false,
        "pg-native": false,
      }
    }
    return config
  },
};

export default nextConfig;
