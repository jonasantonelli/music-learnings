import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Figtree,
  Geist,
  Geist_Mono,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  title: "Music Learnings",
  description: "Notes and lessons from my music studies.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
