import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@clinic-scheduling/domain"],
};

export default nextConfig;
