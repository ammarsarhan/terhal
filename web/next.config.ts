import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server for the Docker image (see web/Dockerfile). Traced from the repo root, since the app pulls in
  // workspace packages.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Local development runs on https://local.terhal.co, https://dashboard.local.terhal.co and https://admin.local.terhal.co
  // (see the README), and Next only serves its dev assets to localhost unless told otherwise.
  allowedDevOrigins: ["local.terhal.co", "*.local.terhal.co"],
};

export default nextConfig;
