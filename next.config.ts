import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/youtube/videos",
        destination: "/api/youtube/videos",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "circuit-nation-sources.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "resources.motogp.pulselive.com",
      },
      {
        protocol: "https",
        hostname: "media.formula1.com",
      },
    ],
  },
};

export default nextConfig;
