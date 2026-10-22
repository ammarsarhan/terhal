import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local development runs on https://local.terhal.co, https://dashboard.local.terhal.co and https://admin.local.terhal.co
  // (see the README), and Next only serves its dev assets to localhost unless told otherwise.
  allowedDevOrigins: ["local.terhal.co", "*.local.terhal.co"],
};

export default nextConfig;
