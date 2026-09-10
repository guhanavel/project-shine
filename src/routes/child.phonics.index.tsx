import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { preloadPhrases } from "@/lib/audioCache";
import { lessonPhrases } from "@/lib/lessonAudio";
import { getActiveChildId } from "@/lib/attempts";
import { BackArrow } from "@/components/icons/BackArrow";
import { BuddyAvatar, BuddyCompanion, useBuddy } from "@/components/BuddyCompanion";
import {
  PHONICS_STEPS,
  getCompleted,
  firstIncomplete,
  resetProgress,
  type PhonicsStepKey,
} from "@/lib/phonicsProgress";

export const Route = createFileRoute("/child/phonics/")({
  head: () => ({ meta: [{ title: "Phonics — Shine" }] }),
  component: PhonicsMap,
});

function PhonicsMap() {
  const buddy = useBuddy();
  const [done, setDone] = useState<PhonicsStepKey[]>([]);
  const [next, setNext] = useState<ReturnType<typeof firstIncomplete>>(null);

  useEffect(() => {
    const read = () => {
      setDone(getCompleted());
      setNext(firstIncomplete());
    };
    read();
    window.addEventListener("shine:phonics-progress", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("shine:phonics-progress", read);
      window.removeEventListener("focus", read);
    };
  }, []);

  const doneSet = new Set(done);
  const pct = Math.round((done.length / PHONICS_STEPS.length) * 100);

  // Warm the very first lesson's audio while the child eyes the map.
  useEffect(() => {
    preloadPhrases([...lessonPhrases.pronounce, ...lessonPhrases.trace]);
  }, []);

  const themes = useQuery({
    queryKey: ["child-active-themes"],
    queryFn: async () => {
      type ThemeCard = {
        id: string;
        slug: string;
        title: string;
        emoji: string | null;
        color: string | null;
      };
      const childId = getActiveChildId();
      if (!childId) return [] as ThemeCard[];
      const { data, error } = await supabase.rpc("get_child_themes", { _child_id: childId });
      if (error) return [] as ThemeCard[];
      return (data ?? []) as ThemeCard[];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-background to-sun/20">
      <header className="px-6 py-4 flex items-center gap-4 border-b border-border/60">
        <Link
          to="/child"
          className="w-10 h-10 rounded-full bg-white border-2 border-border flex items-center justify-center text-foreground/70 hover:text-coral"
          aria-label="Back"
        >
          <BackArrow />
        </Link>
        <h1 className="text-2xl font-bold flex-1">PHONICS</h1>
        <BuddyAvatar />
      </header>
      <main className="px-6 py-10 pb-32 max-w-2xl mx-auto">
        <section className="mb-8 rounded-3xl bg-white border-2 border-border/50 p-5 chunky-shadow">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-float">🗺️</div>
            <div className="flex-1">
              <p className="font-bold text-lg">
                {pct === 100
                  ? "Adventure complete!"
                  : next
                    ? `Up next: ${next.title}`
                    : "Let's begin!"}
              </p>
              <p className="text-sm text-foreground/60">
                {buddy ? `${buddy.name} is with you — ` : ""}
                {done.length} of {PHONICS_STEPS.length} steps done
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-coral transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {next ? (
              <Link
                to={next.to}
                className="btn-chunky inline-flex items-center gap-2 px-6 h-12 bg-coral text-coral-foreground font-bold uppercase tracking-wide"
              >
                {done.length ? "Continue" : "Start"} →
              </Link>
            ) : (
              <Link
                to="/child"
                className="btn-chunky inline-flex items-center gap-2 px-6 h-12 bg-leaf text-white font-bold uppercase tracking-wide"
              >
                Back home →
              </Link>
            )}
            {done.length > 0 && (
              <button
                onClick={resetProgress}
                className="px-5 h-12 rounded-2xl bg-white border-2 border-border font-semibold hover:bg-muted"
              >
                Start over
              </button>
            )}
          </div>
        </section>
        {(themes.data?.length ?? 0) > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎯</span>
              <h2 className="font-bold text-lg">Your class themes</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {(themes.data ?? []).map((t) => (
                <Link
                  key={t.id}
                  to="/child/theme/$themeSlug"
                  params={{ themeSlug: t.slug }}
                  className="min-w-[160px] rounded-2xl bg-white border-2 border-border/60 p-4 chunky-shadow hover:-translate-y-1 transition"
                >
                  <div className="text-4xl">{t.emoji ?? "✨"}</div>
                  <div className="font-bold mt-2">{t.title}</div>
                  <div className="text-xs text-coral font-semibold mt-1">Start →</div>
                </Link>
              ))}
            </div>
          </section>
        )}
        <div className="space-y-4 relative">
          {PHONICS_STEPS.map((s, i) => {
            const isDone = doneSet.has(s.key);
            const isNext = next?.key === s.key;
            return (
              <div key={s.key} className="relative" style={{ marginLeft: `${(i % 3) * 32}px` }}>
                {i < PHONICS_STEPS.length - 1 && (
                  <div
                    className="absolute left-8 top-16 h-8 border-l-4 border-dashed border-border/70"
                    aria-hidden
                  />
                )}
                <Link to={s.to} className="flex items-center gap-5 group">
                  <div
                    className={`${isDone ? "bg-leaf" : s.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl chunky-shadow group-hover:-translate-y-1 transition`}
                  >
                    {isDone ? "✓" : s.n}
                  </div>
                  <div
                    className={`flex-1 bg-white rounded-2xl px-5 py-4 border-2 transition flex items-center gap-3 ${isNext ? "border-coral ring-4 ring-coral/20" : "border-border/40 group-hover:border-coral"}`}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="min-w-0">
                      <span className="block font-bold text-lg leading-tight">{s.title}</span>
                      <span className="block text-xs text-foreground/50">{s.subtitle}</span>
                    </span>
                    <span className="ml-auto text-sm font-bold text-coral">
                      {isNext ? "Next" : isDone ? "Replay" : "→"}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </main>
      <BuddyCompanion
        message={
          buddy ? (next ? `Let's do ${next.title} together!` : "You finished them all!") : undefined
        }
      />
    </div>
  );
}
