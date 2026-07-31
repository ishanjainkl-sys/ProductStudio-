import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@productstudio/shared-types",
    "@productstudio/shared-schemas",
    "@productstudio/component-sdk",
    "@productstudio/component-registry",
    "@productstudio/json-engine",
    "@productstudio/renderer",
    "@productstudio/ui-kit",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
      {
        source: "/exports/:path*",
        destination: `${apiUrl}/exports/:path*`,
      },
      {
        source: "/health",
        destination: `${apiUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
