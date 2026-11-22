// Builds the Next standalone server the desktop app embeds, then copies in the
// static assets and content that server.js expects next to it.
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";

const standalone = ".next/standalone";

rmSync(".next", { recursive: true, force: true });
execSync("next build", {
  stdio: "inherit",
  env: { ...process.env, NEXT_OUTPUT: "standalone" },
});

cpSync(".next/static", `${standalone}/.next/static`, { recursive: true });
if (existsSync("public")) cpSync("public", `${standalone}/public`, { recursive: true });
// Pages read markdown from content/ at render time; ship it in case a route
// renders on demand instead of from the prerendered output.
cpSync("content", `${standalone}/content`, { recursive: true });

console.log(`\nDesktop server ready in ${standalone}`);
