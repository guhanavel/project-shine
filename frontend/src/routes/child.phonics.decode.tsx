import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LessonShell, FeedbackBubble } from "@/components/LessonShell";
import { useSpeak } from "@/lib/useSpeak";
import { useEffect } from "react";
import { logAttempt } from "@/lib/attempts";
import { stepProgress, markComplete } from "@/lib/phonicsProgress";

export const Route = createFileRoute("/child/phonics/decode")({
  head: () => ({ meta: [{ title: "Let's decode — Shine" }] }),
  component: DecodePage,
});

const word = ["d", "i", "g"] as const;

function DecodePage() {
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= word.length;
  const { speak, speaking } = useSpeak();

  useEffect(() => {
    if (revealed > 0 && revealed <= word.length) {
      speak(word[revealed - 1]);
    }
  }, [revealed, speak]);

  useEffect(() => {
    if (done) {
      speak("dig");
      logAttempt({ slug: "decode-dig", correct: true });
      markComplete("decode");
    }
  }, [done, speak]);

  return (
    <LessonShell
      title="LET'S DECODE THE WORD"
      progress={stepProgress("decode")}
      buddyMessage={
        done
          ? "d-i-g… dig! Brilliant decoding! 🎉"
          : revealed > 0
            ? "Keep going — the next sound is waiting."
            : undefined
      }
      buddyTips={[
        "Touch the letters one by one, left to right.",
        "Say each sound, then blend them together.",
        "Listen to me after each letter!",
      ]}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="text-8xl">👷</div>
        <p className="text-foreground/70">Slide your finger → across the letters</p>
        <div className="flex gap-4">
          {word.map((l, i) => (
            <button
              key={i}
              onPointerEnter={() => setRevealed(Math.max(revealed, i + 1))}
              onClick={() => setRevealed(Math.max(revealed, i + 1))}
              className={`w-28 h-28 rounded-2xl text-6xl font-bold border-4 transition chunky-shadow ${
                i < revealed ? "bg-teal text-teal-foreground border-teal" : "bg-white border-border"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        {done && (
          <>
            <p className="text-4xl font-bold text-teal">dig</p>
            <button
              onClick={() => speak("dig")}
              className="px-6 h-12 rounded-2xl bg-white border-2 border-border font-semibold inline-flex items-center gap-2"
            >
              {speaking ? "⏹" : "🔊"} {speaking ? "Stop" : "Hear it again"}
            </button>
            <FeedbackBubble variant="success">Awesome! You got it!</FeedbackBubble>
            <div className="text-center mt-4">
              <div className="text-5xl">🏆</div>
              <p className="text-xl font-semibold mt-2">
                All 5 steps done — you finished today's phonics adventure!
              </p>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/child/phonics"
                  className="px-6 h-14 rounded-2xl bg-white border-2 border-border font-bold inline-flex items-center"
                >
                  See my map
                </Link>
                <Link
                  to="/child"
                  className="px-8 h-14 rounded-2xl bg-coral text-coral-foreground font-bold text-lg chunky-shadow inline-flex items-center gap-2"
                >
                  BACK HOME →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </LessonShell>
  );
}
