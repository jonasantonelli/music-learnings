import { SiteHeader } from "@/components/site-header";
import { Sidebar } from "@/components/sidebar-server";

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 overflow-x-auto">{children}</div>
      </div>
    </>
  );
}
