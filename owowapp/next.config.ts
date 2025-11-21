import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname, ".."),
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

export default nextConfig;
