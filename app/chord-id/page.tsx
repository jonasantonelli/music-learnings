import { SiteHeader } from "@/components/site-header";
import { ChordIdentifier } from "@/components/chord-identifier";

export const metadata = {
  title: "Chord Identifier",
  description:
    "Set notes on a guitar fretboard and get the chord name back, with intervals and alternate readings.",
};

export default function ChordIdPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Chord Identifier
        </h1>
        <p className="mt-2 text-muted-foreground">
          Place notes on the fretboard. The most likely chord name appears below,
          along with the intervals, the notes you played, and other readings.
        </p>
        <div className="mt-8">
          <ChordIdentifier />
        </div>
      </main>
    </>
  );
}
