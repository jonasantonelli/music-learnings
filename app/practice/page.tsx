import { SiteHeader } from "@/components/site-header";
import { NoteWheel } from "@/components/note-wheel";

export default function PracticePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg px-6 py-16">
        <h1 className="text-center text-3xl font-semibold tracking-tight">
          Daily Practice
        </h1>
        <p className="mt-3 text-center text-muted-foreground">
          Spin the wheel to get your practice note.
        </p>
        <div className="mt-12">
          <NoteWheel />
        </div>
      </main>
    </>
  );
}
