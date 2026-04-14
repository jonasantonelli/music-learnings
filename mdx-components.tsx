import type { MDXComponents } from "mdx/types";
import { Fretboard } from "@/components/mdx/fretboard";
import { ChordDiagram } from "@/components/mdx/chord-diagram";
import { Drop2Explorer } from "@/components/mdx/drop-2-explorer";
import { Drop2Progression } from "@/components/mdx/drop-2-progression";
import { ScaleExplorer } from "@/components/mdx/scale-explorer";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Fretboard,
    ChordDiagram,
    Drop2Explorer,
    Drop2Progression,
    ScaleExplorer,
    ...components,
  };
}
