import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LessonShell, NextButton } from "@/components/LessonShell";
import { useSpeak, usePreloadNextLessons } from "@/lib/useSpeak";
import { useEffect } from "react";
import { logAttempt } from "@/lib/attempts";
import { stepProgress, markComplete } from "@/lib/phonicsProgress";

export const Route = createFileRoute("/child/phonics/read")({
  head: () => ({ meta: [{ title: "Let's read — Shine" }] }),
  component: ReadPage,
});

const word = ["n", "a", "p"] as const;

function ReadPage() {
  usePreloadNextLessons("read");
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= word.length;
  const { speak, speaking } = useSpeak();

  useEffect(() => {
    if (revealed > 0 && revealed <= word.length) {
      const letter = word[revealed - 1];
      speak(letter);
    }
  }, [revealed, speak]);

  useEffect(() => {
    if (done) {
      speak("nap");
      logAttempt({ slug: "read-nap", correct: true });
      markComplete("read");
    }
  }, [done, speak]);

  return (
    <LessonShell
      title="LET'S READ"
      progress={stepProgress("read")}
      buddyMessage={
        done
          ? "You blended it — n-a-p says nap! 🎉"
          : revealed > 0
            ? "Keep sliding to the next letter…"
            : undefined
      }
      buddyTips={[
        "Touch the first letter to start.",
        "Slide your finger to the right, sound by sound.",
        "Say each sound out loud with me!",
      ]}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="text-8xl animate-float">😴</div>
        <p className="text-foreground/70">Slide your finger → to blend the sounds</p>
        <div className="flex gap-4">
          {word.map((l, i) => (
            <button
              key={i}
              onClick={() => setRevealed(Math.max(revealed, i + 1))}
              onPointerEnter={() => setRevealed(Math.max(revealed, i + 1))}
              className={`w-28 h-28 rounded-2xl text-6xl font-bold border-4 transition chunky-shadow ${
                i < revealed
                  ? "bg-coral text-coral-foreground border-coral"
                  : "bg-white border-border"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        {done && (
          <>
            <p className="text-4xl font-bold text-coral">nap</p>
            <button
              onClick={() => speak("nap")}
              className="px-6 h-12 rounded-2xl bg-white border-2 border-border font-semibold inline-flex items-center gap-2"
            >
              {speaking ? "⏹" : "🔊"} {speaking ? "Stop" : "Hear it again"}
            </button>
            <NextButton to="/child/phonics/decode" label="NEXT: DECODE" />
          </>
        )}
      </div>
    </LessonShell>
  );
}
