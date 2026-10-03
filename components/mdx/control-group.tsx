"use client";

import { NoteText } from "@/components/note-text";

type Option<T extends string | number> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
};

export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </legend>
      <div className="inline-flex gap-0.5 rounded-control bg-muted p-[3px] dark:border dark:border-border dark:bg-background">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`
                rounded-[7px] dark:rounded-full transition-all text-center
                ${size === "sm" ? "px-2 py-1 text-xs min-w-[2rem]" : "px-3 py-1.5 text-sm min-w-[2.5rem]"}
                ${
                  active
                    ? "bg-card text-foreground shadow-sm font-medium dark:bg-accent-9 dark:text-accent-contrast"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type NoteGridProps = {
  label: string;
  options: Option<number>[];
  value: number;
  onChange: (value: number) => void;
};

export function NoteGrid({ label, options, value, onChange }: NoteGridProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </legend>
      <div className="inline-flex flex-wrap gap-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`
                h-9 w-9 rounded-control text-sm text-center transition-all
                ${
                  active
                    ? "bg-accent-9 text-accent-contrast shadow-sm font-semibold"
                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type StringSetControlProps = {
  label: string;
  options: Option<number>[];
  value: number;
  onChange: (value: number) => void;
};

export function StringSetControl({
  label,
  options,
  value,
  onChange,
}: StringSetControlProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </legend>
      <div className="inline-flex gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`
                rounded-control px-3 py-1.5 text-sm transition-all
                ${
                  active
                    ? "bg-accent-9 text-accent-contrast shadow-sm font-medium"
                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type ToggleSwitchProps = {
  labelOff: string;
  labelOn: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleSwitch({
  labelOff,
  labelOn,
  value,
  onChange,
}: ToggleSwitchProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className={`text-sm transition-colors ${!value ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {labelOff}
      </span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-9 focus-visible:ring-offset-2 data-[state=checked]:bg-accent-9"
        data-state={value ? "checked" : "unchecked"}
      >
        <span
          className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-foreground shadow-sm transition-transform ${value ? "translate-x-[1.125rem]" : "translate-x-[0.175rem]"} data-[state=checked]:bg-accent-contrast`}
          data-state={value ? "checked" : "unchecked"}
        />
      </button>
      <span className={`text-sm transition-colors ${value ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {labelOn}
      </span>
    </label>
  );
}

type ChipGroupProps<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Like StringSetControl, but wraps — for option lists too long for one row. */
export function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`
                rounded-control px-2.5 py-1 text-sm transition-all
                ${
                  active
                    ? "bg-accent-9 text-accent-contrast shadow-sm font-medium"
                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }
              `}
            >
              <NoteText text={opt.label} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type ControlBarProps = {
  children: React.ReactNode;
};

export function ControlBar({ children }: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-8 rounded-card border border-border bg-card p-4">
      {children}
    </div>
  );
}
