/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "placehold.co",
      "lh3.googleusercontent.com"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/avatars/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/plushies/**",
      }
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
}

module.exports = nextConfig
