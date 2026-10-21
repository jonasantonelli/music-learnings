"use client";

import * as React from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  /** Plain text for type-ahead, when `label` isn't a string. */
  text?: string;
};

export type SelectGroup<T extends string> = {
  label?: string;
  /** Lay the group out as a grid (e.g. the 12 keys) instead of a list. */
  columns?: number;
  options: SelectOption<T>[];
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  groups: SelectGroup<T>[];
  /** Accessible name; also shown as a small caption above the value if `caption`. */
  label: string;
  caption?: boolean;
  icon?: LucideIcon;
  /** Tint the trigger, e.g. when a filter is applied. */
  highlighted?: boolean;
  /** Shown on the trigger instead of the selected option's label. */
  display?: React.ReactNode;
  align?: "start" | "end";
  className?: string;
};

/**
 * A dropdown that matches the app instead of the OS menu: a trigger button
 * and a listbox panel, with full keyboard support (arrows, Home/End, Enter,
 * Escape, type-ahead) via aria-activedescendant.
 */
export function Select<T extends string>({
  value,
  onChange,
  groups,
  label,
  caption = false,
  icon: Icon,
  highlighted = false,
  display,
  align = "start",
  className,
}: Props<T>) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const typed = React.useRef({ text: "", at: 0 });

  const flat = groups.flatMap((g) => g.options);
  const selectedIndex = Math.max(0, flat.findIndex((o) => o.value === value));
  const selected = flat[selectedIndex];
  const textOf = (o: SelectOption<T>) => (o.text ?? (typeof o.label === "string" ? o.label : "")).toLowerCase();

  const show = () => {
    setActive(selectedIndex);
    setOpen(true);
  };
  const close = React.useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);
  const choose = (i: number) => {
    onChange(flat[i].value);
    close();
  };

  React.useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  // Keep the active option in view while moving with the keyboard.
  React.useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);

  const onListKey = (e: React.KeyboardEvent) => {
    const last = flat.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      ArrowRight: () => setActive((i) => Math.min(last, i + 1)),
      ArrowLeft: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => close(),
      Tab: () => close(false),
    };
    const action = keys[e.key];
    if (action) {
      if (e.key !== "Tab") e.preventDefault();
      action();
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = e.timeStamp;
      const t = typed.current;
      t.text = (now - t.at > 700 ? "" : t.text) + e.key.toLowerCase();
      t.at = now;
      const hit = flat.findIndex((o) => textOf(o).startsWith(t.text));
      if (hit >= 0) setActive(hit);
    }
  };

  // Index in `flat` of each group's first option.
  const offsets = groups.map((_, g) => groups.slice(0, g).reduce((n, x) => n + x.options.length, 0));

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={caption ? undefined : label}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className={cn(
          "inline-flex h-10 w-full items-center gap-2 rounded-control border bg-card pl-3 pr-2.5 text-left text-sm transition-colors",
          "hover:bg-card-hover focus:outline-none focus-visible:border-accent-7 focus-visible:ring-2 focus-visible:ring-accent-4",
          open ? "border-accent-7" : "border-border",
          highlighted && "border-accent-6 bg-accent-1 text-accent-11",
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          {caption && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>}
          <span className="truncate">{display ?? selected?.label}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
          className={cn(
            "absolute z-20 mt-1.5 max-h-80 min-w-full overflow-auto rounded-card border border-border bg-card p-1.5 shadow-lg shadow-black/10 focus:outline-none dark:shadow-black/40",
            "max-w-[calc(100vw-2rem)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {groups.map((group, g) => (
            <div key={g} role="group" aria-label={group.label} className={cn(g > 0 && "mt-1 border-t border-border pt-1")}>
              {group.label && (
                <div className="px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </div>
              )}
              <div
                className={group.columns ? "grid gap-1" : undefined}
                style={group.columns ? { gridTemplateColumns: `repeat(${group.columns}, minmax(3rem, 1fr))` } : undefined}
              >
                {group.options.map((option, o) => {
                  const i = offsets[g] + o;
                  const isSelected = option.value === value;
                  return (
                    <div
                      key={option.value}
                      id={`${id}-${i}`}
                      role="option"
                      aria-selected={isSelected}
                      onPointerMove={() => setActive(i)}
                      onClick={() => choose(i)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-sm",
                        group.columns && "justify-center px-1.5",
                        i === active && "bg-muted",
                        isSelected ? "font-medium text-foreground" : "text-muted-foreground",
                        isSelected && group.columns && "bg-accent-3 text-accent-11",
                      )}
                    >
                      {!group.columns && (
                        <Check className={cn("h-3.5 w-3.5 shrink-0", !isSelected && "invisible")} />
                      )}
                      <span className="whitespace-nowrap">{option.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
