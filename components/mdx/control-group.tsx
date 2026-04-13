"use client";

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
      <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </legend>
      <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`
                rounded-full transition-all text-center
                ${size === "sm" ? "px-2 py-1 text-xs min-w-[2rem]" : "px-3 py-1.5 text-sm min-w-[2.5rem]"}
                ${
                  active
                    ? "bg-accent-9 text-accent-contrast shadow-sm font-medium"
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
      <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                h-9 w-9 rounded-full text-sm text-center transition-all
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
      <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                rounded-full px-3 py-1.5 text-sm transition-all
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
          className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-foreground shadow-sm transition-transform ${value ? "translate-x-[1.125rem]" : "translate-x-[0.175rem]"} data-[state=checked]:bg-white`}
          data-state={value ? "checked" : "unchecked"}
        />
      </button>
      <span className={`text-sm transition-colors ${value ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {labelOn}
      </span>
    </label>
  );
}

type ControlBarProps = {
  children: React.ReactNode;
};

export function ControlBar({ children }: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-8 rounded-3xl border border-border bg-card/50 p-4">
      {children}
    </div>
  );
}
