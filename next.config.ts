import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // playwright is only used by the Jobgether scraper (local cron / dedicated
  // worker, not Vercel serverless). Mark it as an external server package so
  // Turbopack doesn't try to bundle it into the route — the route will fail
  // at runtime on Vercel (no chromium binary) but at least the build succeeds.
  serverExternalPackages: ["playwright"],
};

export default nextConfig;
