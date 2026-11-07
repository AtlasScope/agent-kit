import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: "/tracking/:id",
        destination: "/shipments/:id",
        permanent: true,
      },
      {
        source: "/shipments/:id",
        destination: "/w/acme/shipments/:id",
        permanent: true,
      },
      {
        source: "/settings/profile",
        destination: "/account/profile",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/workspaces",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
