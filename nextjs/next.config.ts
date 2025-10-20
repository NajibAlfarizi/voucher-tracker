import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export, use server mode instead
  images: {
    unoptimized: true
  }
};

export default nextConfig;
