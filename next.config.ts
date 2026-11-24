import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // The desktop app (electron/) runs Next's self-contained server; the web
  // deploy keeps the default output.
  // The tracing root is pinned so server.js lands at the top of the
  // standalone folder even when a parent directory has its own lockfile.
  ...(process.env.NEXT_OUTPUT === "standalone" && {
    output: "standalone",
    outputFileTracingRoot: process.cwd(),
  }),
  experimental: {
    // The root layout lives under app/[lang], so unmatched URLs need a
    // standalone 404 (app/global-not-found.tsx).
    globalNotFound: true,
  },
};

const withMDX = createMDX({
  options: {
    // Plugins are referenced by name so the config stays serializable for Turbopack.
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
  },
});

export default withMDX(nextConfig);
