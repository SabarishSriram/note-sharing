import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse v2 has no default ESM export – keep it as a native CJS module
  // resolved by Node at runtime, never bundled by Turbopack.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
