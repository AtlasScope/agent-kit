import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: "/calendar", destination: "/agenda", permanent: true },
      { source: "/calendar/:date", destination: "/agenda/:date", permanent: true },
      { source: "/agenda", destination: "/schedule", permanent: true },
      { source: "/agenda/:date", destination: "/schedule", permanent: true },
      { source: "/patient/:id", destination: "/patients/:id", permanent: true },
    ];
  },
};

export default nextConfig;
