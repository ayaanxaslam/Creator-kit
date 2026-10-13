import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Off: with it on, client components that stream in behind session-dependent
  // <Suspense> boundaries (user menu, creator profile) never hydrated in
  // production builds. `false` keeps Next.js's standard prefetch behaviour.
  partialPrefetching: false,
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
