/**
 * Degree roles drive note colours on every fretboard and chord diagram. The
 * role names map to the `--degree-<role>-*` tokens in globals.css.
 */
export type DegreeRole = "root" | "guide" | "color" | "tone" | "passing";

/**
 * Role of a chord degree label ("R", "♭3", "°7", "♯11"…): the root, the
 * guide tones that define the quality (3rds, 7ths), the plain 5th, and every
 * other degree (2/9, 4/11, 6/13) as a colour tone.
 */
export function roleForDegree(label: string): DegreeRole {
  if (label === "R" || label === "1") return "root";
  const number = Number(label.replace(/[^0-9]/g, ""));
  if (number === 3 || number === 7) return "guide";
  if (number === 5) return "tone";
  return "color";
}

/** Fill, label and outline colours for a note dot with the given role. */
export function degreeMarkerStyle(role: DegreeRole): {
  color: string;
  labelColor: string;
  stroke?: string;
} {
  return {
    color: `var(--degree-${role}-bg)`,
    labelColor: `var(--degree-${role}-fg)`,
    stroke: hasDegreeBorder(role) ? `var(--degree-${role}-border)` : undefined,
  };
}

/** Light roles get an outline so they read against the fretboard. */
export function hasDegreeBorder(role: DegreeRole): boolean {
  return role === "guide" || role === "color" || role === "tone";
}
