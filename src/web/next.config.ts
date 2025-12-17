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

  // Note: API proxying is handled by middleware.ts at runtime
  // This allows reading API_URL from runtime environment variables
  // (next.config.ts rewrites are evaluated at build time only)

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
