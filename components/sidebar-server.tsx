import { getTree } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import { SidebarClient } from "./sidebar";

export function Sidebar({ lang }: { lang: Locale }) {
  const tree = getTree(lang);
  return <SidebarClient tree={tree} />;
}
