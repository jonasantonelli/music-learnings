import { Fragment } from "react";

// None of the app fonts ship "♯" (or the double accidentals), so the browser
// falls back to a symbol font whose glyph is ~1.5× the cap height. Wrapping
// them in `.acc` scales them back down to sit with the letter name.
const ACCIDENTAL = /([♯𝄪𝄫])/u;

/**
 * Renders a note/degree label with accidentals sized to match the letters.
 * Pass `svg` when rendering inside an SVG `<text>` element.
 */
export function NoteText({ text, svg = false }: { text: string; svg?: boolean }) {
  const parts = text.split(ACCIDENTAL);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        !ACCIDENTAL.test(part) ? (
          <Fragment key={i}>{part}</Fragment>
        ) : svg ? (
          <tspan key={i} className="acc">
            {part}
          </tspan>
        ) : (
          <span key={i} className="acc">
            {part}
          </span>
        ),
      )}
    </>
  );
}
