/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/dashboard', destination: '/home', permanent: false },
      { source: '/home', destination: '/overview', permanent: false },
    ];
  },
};
export default nextConfig;
