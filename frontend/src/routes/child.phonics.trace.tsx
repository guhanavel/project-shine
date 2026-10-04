import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LessonShell, FeedbackBubble, NextButton } from "@/components/LessonShell";
import { useSpeak, usePreloadNextLessons } from "@/lib/useSpeak";
import { logAttempt } from "@/lib/attempts";
import { stepProgress, markComplete } from "@/lib/phonicsProgress";
import { TracingCanvas } from "@/components/TracingCanvas";
import { letterSTemplate } from "@/data/tracingTemplates";

export const Route = createFileRoute("/child/phonics/trace")({
  head: () => ({ meta: [{ title: "Trace the letter — Shine" }] }),
  component: TracePage,
});

function TracePage() {
  usePreloadNextLessons("trace");
  const [completed, setCompleted] = useState(false);
  const { speak } = useSpeak();

  const handleComplete = (coveragePct: number) => {
    setCompleted(true);
    speak("s. sun.");
    markComplete("trace");
    void logAttempt({
      slug: "trace-s",
      correct: true,
      meta: { coveragePct: Math.round(coveragePct) },
    });
  };

  return (
    <LessonShell
      title="TRACE THE LETTER"
      progress={stepProgress("trace")}
      buddyMessage={
        completed
          ? "Super tracing! You made the letter 's'."
          : "Start at the coral dot and follow the guide."
      }
      buddyTips={[
        "Start on the coral dot.",
        "Keep your finger or pointer on the dotted guide.",
        "If your stroke leaves the guide, start again at the coral dot.",
      ]}
    >
      <p className="mb-6 text-center text-foreground/70">
        Trace the letter s by following the dotted guide.
      </p>
      <TracingCanvas template={letterSTemplate} onComplete={handleComplete} />
      {completed && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <FeedbackBubble variant="success">Great tracing! s is for sun.</FeedbackBubble>
          <NextButton to="/child/phonics/sound" label="NEXT: LISTEN" />
        </div>
      )}
    </LessonShell>
  );
}
