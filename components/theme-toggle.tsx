"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { defineMessages } from "@/lib/i18n";
import { useMessages } from "@/components/locale-provider";

const messages = defineMessages({
  en: { toggle: "Toggle theme" },
  pt: { toggle: "Alternar tema" },
  es: { toggle: "Cambiar tema" },
});

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useMessages(messages);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = mounted ? resolvedTheme ?? theme : undefined;

  return (
    <button
      type="button"
      aria-label={t.toggle}
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border bg-card text-foreground transition-colors hover:bg-muted dark:text-tone-butter"
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
