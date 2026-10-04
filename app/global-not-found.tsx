import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { localeNames, locales } from "@/lib/i18n";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 — Music Learnings",
};

// Unmatched URLs have no locale to render in, so this page speaks all three.
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="font-display text-5xl">404</h1>
        <p className="text-muted-foreground">
          Page not found · Página não encontrada · Página no encontrada
        </p>
        <nav className="flex gap-2">
          {locales.map((l) => (
            <a
              key={l}
              href={`/${l}`}
              className="rounded-control border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              {localeNames[l]}
            </a>
          ))}
        </nav>
      </body>
    </html>
  );
}
