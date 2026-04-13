import { getTree } from "@/lib/content";
import { SidebarClient } from "./sidebar";

export function Sidebar() {
  const tree = getTree();
  return <SidebarClient tree={tree} />;
}
