"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/content";

function renderNode(
  node: TreeNode,
  depth: number,
  pathname: string,
): React.ReactNode {
  if (node.kind === "lesson") {
    const active = pathname === node.lesson.href;
    return (
      <li key={node.lesson.href}>
        <Link
          href={node.lesson.href}
          className={cn(
            "block rounded-full border-l-2 px-3 py-1 text-sm transition-colors",
            active
              ? "border-accent-9 bg-accent-3 text-accent-11 font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-accent-7",
          )}
        >
          {node.lesson.frontmatter.title}
        </Link>
      </li>
    );
  }

  return (
    <li key={node.slug.join("/")}>
      <div
        className={
          depth === 0
            ? "mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-accent-11"
            : "mt-2 mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        }
      >
        {node.title}
      </div>
      <ul className="pl-2">
        {node.children.map((c) => renderNode(c, depth + 1, pathname))}
      </ul>
    </li>
  );
}

export function SidebarClient({ tree }: { tree: TreeNode[] }) {
  const pathname = usePathname();
  return (
    <nav className="w-64 shrink-0 border-r border-border bg-card/30 px-4 py-6 overflow-y-auto">
      <ul>{tree.map((n) => renderNode(n, 0, pathname))}</ul>
    </nav>
  );
}
