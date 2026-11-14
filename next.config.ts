import type { NextConfig } from "next";

const staticExport = process.env.NP_STATIC === "1";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  ...(staticExport ? { output: "export" as const } : {}),
  ...(staticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/admin",
              headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
            },
            {
              source: "/admin/:path*",
              headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
            },
          ];
        },
      }),
};

export default nextConfig;
