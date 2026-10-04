import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { frontmatterSchema, type Frontmatter } from "./schema";
import { defaultLocale, localizeHref, type Locale } from "./i18n";

export const CONTENT_DIR = path.join(process.cwd(), "content");

/** Root of one locale's content, e.g. content/pt. */
export function contentRoot(lang: Locale): string {
  return path.join(CONTENT_DIR, lang);
}

/**
 * Resolves a content file for a locale, falling back to the English source
 * when it has not been translated yet. `rel` is relative to the locale root.
 */
export function resolveContentFile(
  lang: Locale,
  rel: string,
): { filePath: string; contentLang: Locale } {
  const localized = path.join(contentRoot(lang), rel);
  if (lang !== defaultLocale && fs.existsSync(localized)) {
    return { filePath: localized, contentLang: lang };
  }
  return {
    filePath: path.join(contentRoot(defaultLocale), rel),
    contentLang: defaultLocale,
  };
}

export type Lesson = {
  slug: string[]; // e.g. ["theory", "intervals"]
  href: string; // e.g. "/pt/lessons/theory/intervals"
  filePath: string;
  /** Locale the file was actually read from (differs when falling back). */
  contentLang: Locale;
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

function readMeta(lang: Locale, rel: string): SectionMeta {
  const metaPath = resolveContentFile(lang, path.join(rel, "_meta.json")).filePath;
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8")) as SectionMeta;
  } catch {
    return {};
  }
}

// The English tree is canonical: it decides which sections and lessons exist,
// and each locale overlays its translated files and _meta.json titles.
function walk(lang: Locale, slug: string[]): TreeNode[] {
  const dir = path.join(contentRoot(defaultLocale), ...slug);
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    if (slug.length === 0 && entry.name === "songs") continue;

    if (entry.isDirectory()) {
      const childSlug = [...slug, entry.name];
      const meta = readMeta(lang, childSlug.join("/"));
      nodes.push({
        kind: "section",
        name: entry.name,
        title: meta.title ?? titleize(entry.name),
        order: meta.order ?? 999,
        slug: childSlug,
        children: walk(lang, childSlug),
      });
      continue;
    }

    if (!/\.mdx?$/.test(entry.name)) continue;

    const { filePath, contentLang } = resolveContentFile(
      lang,
      path.join(...slug, entry.name),
    );
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);
    const parsed = frontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in ${path.relative(process.cwd(), filePath)}:\n${parsed.error.message}`,
      );
    }

    const fileSlug = entry.name.replace(/\.mdx?$/, "");
    const lessonSlug = [...slug, fileSlug];
    nodes.push({
      kind: "lesson",
      lesson: {
        slug: lessonSlug,
        href: localizeHref(lang, "/lessons/" + lessonSlug.join("/")),
        filePath,
        contentLang,
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
    return nameA.localeCompare(nameB, lang);
  });

  return nodes;
}

const _trees = new Map<Locale, TreeNode[]>();
export function getTree(lang: Locale): TreeNode[] {
  let tree = _trees.get(lang);
  if (!tree) {
    tree = walk(lang, []);
    _trees.set(lang, tree);
  }
  return tree;
}

export function getAllLessons(lang: Locale): Lesson[] {
  const out: Lesson[] = [];
  const visit = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.kind === "lesson") out.push(n.lesson);
      else visit(n.children);
    }
  };
  visit(getTree(lang));
  return out;
}

export function getLessonBySlug(lang: Locale, slug: string[]): Lesson | undefined {
  const target = slug.join("/");
  return getAllLessons(lang).find((l) => l.slug.join("/") === target);
}

export function getTopSections(lang: Locale): Extract<TreeNode, { kind: "section" }>[] {
  return getTree(lang).filter(
    (n): n is Extract<TreeNode, { kind: "section" }> => n.kind === "section",
  );
}

/** Titles of the sections containing a lesson, e.g. ["Scales", "Greek Modes"]. */
export function getSectionTrail(lang: Locale, slug: string[]): string[] {
  const trail: string[] = [];
  let nodes = getTree(lang);
  for (const name of slug.slice(0, -1)) {
    const section = nodes.find(
      (n): n is Extract<TreeNode, { kind: "section" }> =>
        n.kind === "section" && n.name === name,
    );
    if (!section) break;
    trail.push(section.title);
    nodes = section.children;
  }
  return trail;
}
