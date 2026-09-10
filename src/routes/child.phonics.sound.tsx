import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { LessonShell, FeedbackBubble, NextButton } from "@/components/LessonShell";
import { usePreloadNextLessons } from "@/lib/useSpeak";
import { getCachedUrl } from "@/lib/audioCache";
import { logAttempt } from "@/lib/attempts";
import { stepProgress, markComplete } from "@/lib/phonicsProgress";

export const Route = createFileRoute("/child/phonics/sound")({
  head: () => ({ meta: [{ title: "What sound do you hear? — Shine" }] }),
  component: SoundPage,
});

const letters = ["i", "m", "d", "n"] as const;
const correct = "m";

function SoundPage() {
  usePreloadNextLessons("sound");
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "error" | "success">("idle");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const url = getCachedUrl(correct);
    if (!url) {
      setPlaying(false);
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    const clear = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setPlaying(false);
    };
    audio.onended = clear;
    audio.onerror = clear;
    audio.onpause = clear;
    await audio.play().catch(clear);
  };

  const pick = (l: string) => {
    setPicked(l);
    const ok = l === correct;
    setState(ok ? "success" : "error");
    if (ok) markComplete("sound");
    logAttempt({ slug: "sound-m", correct: ok, meta: { picked: l } });
  };

  return (
    <LessonShell
      title="WHAT SOUND DO YOU HEAR?"
      progress={stepProgress("sound")}
      buddyMessage={
        playing
          ? "Listen closely…"
          : state === "success"
            ? "Yes! That's the 'm' sound. 🎉"
            : state === "error"
              ? "Not that one — play the sound again and listen."
              : undefined
      }
      buddyTips={[
        "Tap the speaker to hear the sound.",
        "Then pick the letter that makes it.",
        "You can listen as many times as you like.",
      ]}
    >
      <div className="flex flex-col items-center gap-8">
        <button
          onClick={playSound}
          className={`w-24 h-24 rounded-full bg-teal text-teal-foreground text-4xl chunky-shadow hover:scale-105 transition ${playing ? "animate-pulse" : ""}`}
        >
          {playing ? "⏹" : "🔊"}
        </button>
        <p className="text-foreground/60">{playing ? "Tap to stop" : "Tap to play the sound"}</p>
        <div className="grid grid-cols-4 gap-4">
          {letters.map((l) => {
            const isPicked = picked === l;
            const isRight = state === "success" && isPicked;
            const isWrong = state === "error" && isPicked;
            return (
              <button
                key={l}
                onClick={() => pick(l)}
                className={`w-24 h-24 rounded-2xl text-5xl font-bold border-4 chunky-shadow transition ${
                  isRight
                    ? "bg-leaf text-white border-leaf"
                    : isWrong
                      ? "bg-berry/20 text-berry border-berry"
                      : "bg-white border-border hover:border-coral hover:-translate-y-1"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
        {state === "error" && (
          <div className="flex gap-3 items-center">
            <FeedbackBubble variant="error">Not quite! Try again!</FeedbackBubble>
            <button
              onClick={() => {
                setState("idle");
                setPicked(null);
              }}
              className="text-sm underline"
            >
              Reset
            </button>
          </div>
        )}
        {state === "success" && (
          <>
            <FeedbackBubble variant="success">Awesome! You got it!</FeedbackBubble>
            <NextButton to="/child/phonics/read" label="NEXT: READ" />
          </>
        )}
      </div>
    </LessonShell>
  );
}
