import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(CONFIG_DIR, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: REPO_ROOT,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/fhir/:path*",
        destination: `${API_URL}/fhir/:path*`,
      },
    ];
  },
};

export default nextConfig;
