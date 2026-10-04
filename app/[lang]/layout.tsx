import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Figtree,
  Geist,
  Geist_Mono,
  JetBrains_Mono,
} from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { LocaleProvider } from "@/components/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { defineMessages, hasLocale, htmlLang, locales } from "@/lib/i18n";

// Light theme (Studio) uses Geist; dark theme (Nocturne) swaps to
// Figtree / Bricolage Grotesque / JetBrains Mono via CSS variables.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const fontVariables = [geist, geistMono, figtree, bricolage, jetbrainsMono]
  .map((f) => f.variable)
  .join(" ");

const messages = defineMessages({
  en: { description: "Notes and lessons from my music studies." },
  pt: { description: "Notas e lições dos meus estudos de música." },
  es: { description: "Notas y lecciones de mis estudios de música." },
});

// Only the supported locales exist; anything else under /[lang] is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title: "Music Learnings",
    description: messages[lang].description,
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={htmlLang[lang]}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider lang={lang}>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
