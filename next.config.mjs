/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 1) Keep your existing domain for placehold.co
    domains: ["placehold.co"],

    // 2) Add a remotePatterns entry for Firebase
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
