import { SiteHeader } from "@/components/site-header";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/sidebar-server";
import { hasLocale } from "@/lib/i18n";

export default async function LessonsLayout({
  children,
  params,
}: LayoutProps<"/[lang]/lessons">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <SiteHeader lang={lang} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar lang={lang} />
        <div className="flex-1 min-w-0 overflow-x-auto">{children}</div>
      </div>
    </>
  );
}
