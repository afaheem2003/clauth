/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "placehold.co",
      "lh3.googleusercontent.com",
      "bpvyypcpikgmrmlfajctb.supabase.co",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bpvyypcpikgmrmlfajctb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

module.exports = nextConfig
