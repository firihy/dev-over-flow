import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only the mock avatar for now; add OAuth avatar hosts when real users land
    remotePatterns: [
      new URL("https://static.vecteezy.com/system/resources/previews/**"),
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
