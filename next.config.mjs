/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 1) Existing domain
    domains: ["placehold.co", "lh3.googleusercontent.com"],

    // 2) Firebase remote pattern
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;