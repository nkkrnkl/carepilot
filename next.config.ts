import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@prisma/client"],
  // Vercel automatically handles serverless optimization
  // No need for "standalone" output mode on Vercel
};

export default nextConfig;
