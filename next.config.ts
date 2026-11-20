import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The link-preview route's SSRF-safe HTTP client must run as plain Node code, not bundled.
  serverExternalPackages: ["undici"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
