import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",

  // Allow dev access
  allowedDevOrigins: ["https://dev.myuglyrocks.com"],

  // Proxy /api requests to backend API for same-origin cookie support
  // This allows SameSite=Lax cookies to work without cross-subdomain issues
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.API_URL;
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Optimize images
  // Note: AVIF removed - encoding is too slow on-demand and WEBP provides excellent compression
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Enable experimental features for optimization
  experimental: {
    // optimizePackageImports enables tree-shaking for these packages
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "date-fns",
      "@tanstack/react-query",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
