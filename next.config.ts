import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "Rise-Moon";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },

  // GitHub Pages base path
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : ""
};

export default nextConfig;
