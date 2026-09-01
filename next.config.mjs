import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "coresg-normal.trae.ai" }
    ]
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"]
  }
};

export default nextConfig;
