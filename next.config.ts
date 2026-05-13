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
  // playwright is in devDependencies and only used by the local-CLI Jobgether
  // scraper (scripts/scrape-jobgether-test.ts). Nothing in the Next.js app
  // imports it, so Turbopack should never encounter it.
};

export default nextConfig;
