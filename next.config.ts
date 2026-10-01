import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Application photos are up to 5 MB; leave room for multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
