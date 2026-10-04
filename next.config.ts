import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
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
