import type { NextConfig } from 'next';

const config: NextConfig = {
  async redirects() {
    return [
      { source: '/dashboard', destination: '/overview', permanent: false },
      { source: '/overview', destination: '/home', permanent: false },
      { source: '/workspace', destination: '/settings/workspace', permanent: false },
      { source: '/p/:id', destination: '/projects/:id', permanent: false },
    ];
  },
};

export default config;
