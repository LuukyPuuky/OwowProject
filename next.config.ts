import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    localPatterns: [
      {
        pathname: "/api/preview",
        search: "t=*",
      },
    ],
  },
};

export default nextConfig;
