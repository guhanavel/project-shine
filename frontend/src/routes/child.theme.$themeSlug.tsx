import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LessonShell, FeedbackBubble, NextButton } from "@/components/LessonShell";
import { useSpeak } from "@/lib/useSpeak";
import { preloadPhrases } from "@/lib/audioCache";
import { logAttempt } from "@/lib/attempts";

export const Route = createFileRoute("/child/theme/$themeSlug")({
  head: () => ({
    meta: [
      { title: "Practice — Shine" },
      {
        name: "description",
        content: "Practice a themed pack of letters and words with your buddy.",
      },
    ],
  }),
  component: ThemePractice,
});

type ThemeRow = {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  color: string | null;
};
type Item = { id: string; kind: "letter" | "word"; value: string; position: number };

function ThemePractice() {
  const { themeSlug } = Route.useParams();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const { speak, speaking } = useSpeak();

  const theme = useQuery({
    queryKey: ["child-theme", themeSlug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_theme_by_slug", { _slug: themeSlug });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        id: string;
        slug: string;
        title: string;
        emoji: string | null;
        color: string | null;
        item_id: string | null;
        kind: string | null;
        value: string | null;
        item_position: number | null;
      }>;
      if (!rows.length) return null;
      const first = rows[0];
      const theme: ThemeRow = {
        id: first.id,
        slug: first.slug,
        title: first.title,
        emoji: first.emoji,
        color: first.color,
      };
      const items = rows
        .filter((r) => r.item_id && r.value)
        .map((r) => ({
          id: r.item_id as string,
          kind: (r.kind === "word" ? "word" : "letter") as Item["kind"],
          value: r.value as string,
          position: r.item_position ?? 0,
        }));
      return { theme, items };
    },
  });

  const items = theme.data?.items ?? [];
  const current = items[idx];

  const phrases = useMemo(() => items.map((i) => i.value), [items]);
  useEffect(() => {
    if (phrases.length) preloadPhrases(phrases);
  }, [phrases]);

  useEffect(() => {
    if (current) speak(current.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const advance = (correct = true) => {
    if (current)
      logAttempt({ slug: `theme-${themeSlug}-${current.kind}-${current.value}`, correct });
    if (idx + 1 >= items.length) setDone(true);
    else setIdx(idx + 1);
  };

  const progress = items.length ? Math.round(((idx + (done ? 1 : 0)) / items.length) * 100) : 0;

  if (theme.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground/60">
        Loading…
      </div>
    );
  }
  if (!theme.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-xl font-bold">Theme not found</div>
          <Link to="/child" className="mt-4 inline-block text-coral font-semibold">
            Back home
          </Link>
        </div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-xl font-bold">{theme.data.theme.title}</div>
          <p className="text-foreground/60 mt-2">This theme has no items yet.</p>
          <Link to="/child" className="mt-4 inline-block text-coral font-semibold">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const t = theme.data.theme;

  return (
    <LessonShell
      title={`${t.emoji ?? "✨"}  ${t.title.toUpperCase()}`}
      progress={progress}
      back="/child"
      buddyMessage={
        done
          ? "You finished the whole theme! Superstar! 🌟"
          : current
            ? `Let's practise "${current.value}" together.`
            : undefined
      }
      buddyTips={[
        "Tap the speaker to hear it first.",
        "Say it out loud with me.",
        "Then tap the button to move on.",
      ]}
    >
      {done ? (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-8xl animate-bounce-in">🌟</div>
          <FeedbackBubble variant="success">You practiced all {items.length} items!</FeedbackBubble>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIdx(0);
                setDone(false);
              }}
              className="px-6 h-12 rounded-2xl bg-white border-2 border-border font-semibold"
            >
              🔁 Practice again
            </button>
            <NextButton to="/child" label="HOME" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <p className="text-foreground/60 text-sm">
            Item {idx + 1} of {items.length} · {current.kind}
          </p>
          <div className="bg-gradient-to-br from-sun/40 to-coral/20 rounded-3xl px-16 py-14 chunky-shadow flex items-center justify-center min-w-[260px]">
            <span className="text-8xl md:text-9xl font-bold text-coral tracking-widest">
              {current.value}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => speak(current.value)}
              disabled={speaking}
              className="px-6 h-14 rounded-2xl bg-white border-2 border-border font-bold text-lg inline-flex items-center gap-2"
            >
              {speaking ? "🎧" : "🔊"} Hear it
            </button>
            <button
              onClick={() => advance(true)}
              className="px-8 h-14 rounded-2xl bg-teal text-teal-foreground font-bold text-lg chunky-shadow"
            >
              ✓ I said it
            </button>
            <button
              onClick={() => advance(false)}
              className="px-6 h-14 rounded-2xl bg-white border-2 border-border font-semibold text-foreground/70"
            >
              Skip →
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
            {items.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i < idx ? "bg-teal" : i === idx ? "bg-coral" : "bg-border/60"}`}
              />
            ))}
          </div>
        </div>
      )}
    </LessonShell>
  );
}
