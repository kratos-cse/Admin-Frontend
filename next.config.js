/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backend = (process.env.API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backend}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
