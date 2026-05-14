import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "circuit-nation-sources.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
