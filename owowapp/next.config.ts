/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: true,
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/preview",
        search: "t=*",
      },
    ],
  },
};

module.exports = nextConfig;
