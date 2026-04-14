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
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-x-auto">{children}</div>
      </div>
    </>
  );
}
