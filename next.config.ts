import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    turbopackSourceMaps: false,
    turbopackInputSourceMaps: false,
  },
  turbopack: {
    root: path.join(process.cwd()),
  },
};

export default nextConfig;
