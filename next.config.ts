import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.bezemisi.cz" },
      { protocol: "https", hostname: "bezemisi.cz" },
      { protocol: "https", hostname: "auto.bezemisi.cz" },
    ],
  },
};

export default nextConfig;
