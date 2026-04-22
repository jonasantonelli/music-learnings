import type { MDXComponents } from "mdx/types";
import { ArpeggioExplorer } from "@/components/mdx/arpeggio-explorer";
import { Fretboard } from "@/components/mdx/fretboard";
import { ChordDiagram } from "@/components/mdx/chord-diagram";
import { Drop2Explorer } from "@/components/mdx/drop-2-explorer";
import { Drop2Progression } from "@/components/mdx/drop-2-progression";
import { ScaleExplorer } from "@/components/mdx/scale-explorer";
import { SongChart } from "@/components/mdx/song-chart";
import { TetradChordExplorer } from "@/components/mdx/tetrad-chord-explorer";
import { WalkingBassExplorer } from "@/components/mdx/walking-bass-explorer";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ArpeggioExplorer,
    Fretboard,
    ChordDiagram,
    Drop2Explorer,
    Drop2Progression,
    ScaleExplorer,
    SongChart,
    TetradChordExplorer,
    WalkingBassExplorer,
    ...components,
  };
}
