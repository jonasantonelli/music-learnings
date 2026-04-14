import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { frontmatterSchema, type Frontmatter } from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export type Lesson = {
  slug: string[]; // e.g. ["theory", "intervals"]
  href: string; // e.g. "/lessons/theory/intervals"
  filePath: string;
  frontmatter: Frontmatter;
};

export type SectionMeta = {
  title?: string;
  order?: number;
};

export type TreeNode =
  | { kind: "lesson"; lesson: Lesson }
  | {
      kind: "section";
      name: string;
      title: string;
      order: number;
      slug: string[];
      children: TreeNode[];
    };

function titleize(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function readMeta(dir: string): SectionMeta {
  const metaPath = path.join(dir, "_meta.json");
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8")) as SectionMeta;
  } catch {
    return {};
  }
}

function walk(dir: string, slug: string[]): TreeNode[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const childSlug = [...slug, entry.name];
      const meta = readMeta(fullPath);
      nodes.push({
        kind: "section",
        name: entry.name,
        title: meta.title ?? titleize(entry.name),
        order: meta.order ?? 999,
        slug: childSlug,
        children: walk(fullPath, childSlug),
      });
      continue;
    }

    if (!/\.mdx?$/.test(entry.name)) continue;

    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw);
    const parsed = frontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in ${path.relative(process.cwd(), fullPath)}:\n${parsed.error.message}`,
      );
    }

    const fileSlug = entry.name.replace(/\.mdx?$/, "");
    const lessonSlug = [...slug, fileSlug];
    nodes.push({
      kind: "lesson",
      lesson: {
        slug: lessonSlug,
        href: "/lessons/" + lessonSlug.join("/"),
        filePath: fullPath,
        frontmatter: parsed.data,
      },
    });
  }

  nodes.sort((a, b) => {
    const orderA = a.kind === "lesson" ? a.lesson.frontmatter.order : a.order;
    const orderB = b.kind === "lesson" ? b.lesson.frontmatter.order : b.order;
    if (orderA !== orderB) return orderA - orderB;
    const nameA = a.kind === "lesson" ? a.lesson.frontmatter.title : a.title;
    const nameB = b.kind === "lesson" ? b.lesson.frontmatter.title : b.title;
    return nameA.localeCompare(nameB);
  });

  return nodes;
}

let _tree: TreeNode[] | null = null;
export function getTree(): TreeNode[] {
  if (_tree) return _tree;
  _tree = walk(CONTENT_DIR, []);
  return _tree;
}

export function getAllLessons(): Lesson[] {
  const out: Lesson[] = [];
  const visit = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.kind === "lesson") out.push(n.lesson);
      else visit(n.children);
    }
  };
  visit(getTree());
  return out;
}

export function getLessonBySlug(slug: string[]): Lesson | undefined {
  const target = slug.join("/");
  return getAllLessons().find((l) => l.slug.join("/") === target);
}

export function getTopSections(): Extract<TreeNode, { kind: "section" }>[] {
  return getTree().filter(
    (n): n is Extract<TreeNode, { kind: "section" }> => n.kind === "section",
  );
}
