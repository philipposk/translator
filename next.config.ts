import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Pin the workspace root (several lockfiles exist above this dir).
  turbopack: { root: process.cwd() },
  experimental: {
    // Workaround for Next 16 + Apple Silicon Turbopack CPU runaway (vercel/next.js#93896).
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// Only wrap for the production (webpack) build. In dev, export a plain config so
// Serwist's webpack() hook never reaches Turbopack — that mismatch pegs every core.
export default process.env.NODE_ENV === "development" ? nextConfig : withSerwist(nextConfig);
