import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disabled so Realtime subscription isn't closed by Strict Mode's double mount in dev
  reactStrictMode: false,
};

export default nextConfig;
