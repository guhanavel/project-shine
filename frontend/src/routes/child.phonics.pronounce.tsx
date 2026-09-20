import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LessonShell, FeedbackBubble, NextButton } from "@/components/LessonShell";
import { usePreloadNextLessons } from "@/lib/useSpeak";
import { logAttempt } from "@/lib/attempts";
import { resolveAudioUrl } from "@/lib/audio";
import { decodeUrl, decodeBlob, envelope, similarity, drawEnvelope } from "@/lib/waveform";
import { stepProgress, markComplete } from "@/lib/phonicsProgress";

export const Route = createFileRoute("/child/phonics/pronounce")({
  head: () => ({ meta: [{ title: "Pronounce the letter — Shine" }] }),
  component: PronouncePage,
});

type State = "idle" | "error" | "hint" | "success";

const TARGET = "s";
const THRESHOLD = 0.9;

function PronouncePage() {
  usePreloadNextLessons("pronounce");
  const [state, setState] = useState<State>("idle");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const refCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const youCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refEnvRef = useRef<number[] | null>(null);
  const refUrlRef = useRef<string | null>(resolveAudioUrl(TARGET));
  const hintAudioRef = useRef<HTMLAudioElement | null>(null);
  const [hintPlaying, setHintPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = refUrlRef.current;
      if (!url) return;
      try {
        const buf = await decodeUrl(url);
        const env = envelope(buf);
        if (cancelled) return;
        refEnvRef.current = env;
        if (refCanvasRef.current) drawEnvelope(refCanvasRef.current, env, "#14b8a6");
      } catch {
        // Ignore — reference envelope is a visual aid, not required for scoring.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const playHint = async () => {
    if (hintAudioRef.current) {
      hintAudioRef.current.pause();
      hintAudioRef.current = null;
      setHintPlaying(false);
      return;
    }
    setState("hint");
    const url = refUrlRef.current;
    if (!url) return;
    const audio = new Audio(url);
    hintAudioRef.current = audio;
    setHintPlaying(true);
    const clear = () => {
      if (hintAudioRef.current === audio) hintAudioRef.current = null;
      setHintPlaying(false);
    };
    audio.onended = clear;
    audio.onerror = clear;
    audio.onpause = clear;
    audio.play().catch(clear);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await compareRecording(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setState("error");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const compareRecording = async (blob: Blob) => {
    setBusy(true);
    try {
      const buf = await decodeBlob(blob);
      const env = envelope(buf);
      if (youCanvasRef.current) drawEnvelope(youCanvasRef.current, env, "#ff6b6b");
      const ref = refEnvRef.current;
      const sim = ref ? similarity(ref, env) : 0;
      setScore(sim);
      const ok = sim >= THRESHOLD;
      if (ok) setState("success");
      else setState("error");
      if (ok) markComplete("pronounce");
      logAttempt({
        slug: "pronounce-s",
        correct: ok,
        transcript: `waveform ${(sim * 100).toFixed(0)}%`,
      });
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const handleMic = () => {
    if (busy) return;
    if (recording) stopRecording();
    else startRecording();
  };

  return (
    <LessonShell
      title="PRONOUNCE THE LETTER"
      progress={stepProgress("pronounce")}
      buddyMessage={
        recording
          ? "I'm listening… say 'sss' nice and long!"
          : busy
            ? "Let me check your sound wave…"
            : state === "success"
              ? "Wow, that matched! Ready for tracing?"
              : state === "error"
                ? "So close! Listen once more, then try again."
                : undefined
      }
      buddyTips={[
        "Tap the big 's' to hear how it sounds.",
        "Then tap the mic and copy the sound.",
        "Watch the two waves — make yours look the same!",
      ]}
    >
      <p className="text-center text-foreground/70 mb-8">
        Tap the letter <span className="font-bold text-coral">'s'</span> to hear it, then tap the
        mic and match the sound wave.
      </p>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="bg-gradient-to-br from-sun/40 to-coral/20 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[360px] chunky-shadow">
          {state === "hint" ? (
            <div className="text-center animate-bounce-in">
              <div className="text-8xl font-bold text-coral tracking-widest">SUN</div>
              <div className="text-6xl mt-4">☀️</div>
              <p className="text-sm text-foreground/60 mt-4">Here's a hint for you!</p>
            </div>
          ) : (
            <button
              onClick={playHint}
              className="text-[200px] leading-none font-bold text-coral hover:scale-105 transition"
            >
              s
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleMic}
            disabled={busy}
            className={`w-40 h-40 rounded-full text-coral-foreground text-6xl chunky-shadow hover:-translate-y-1 transition flex items-center justify-center ${
              recording ? "bg-berry animate-pulse" : "bg-coral"
            } ${busy ? "opacity-60" : ""}`}
          >
            {busy ? "…" : recording ? "⏹" : "🎤"}
          </button>
          <p className="text-sm text-foreground/60">
            {recording ? "Tap to stop" : busy ? "Listening…" : "Tap to record"}
          </p>
          {state === "error" && (
            <FeedbackBubble variant="error">
              Almost!{" "}
              {score !== null
                ? `${Math.round(score * 100)}% match — aim for ${Math.round(THRESHOLD * 100)}%.`
                : "Try again!"}
            </FeedbackBubble>
          )}
          {state === "success" && (
            <>
              <FeedbackBubble variant="success">
                Great match! {score !== null ? `${Math.round(score * 100)}%` : ""}
              </FeedbackBubble>
              <NextButton to="/child/phonics/trace" label="NEXT: TRACE" />
            </>
          )}
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="bg-white/70 rounded-2xl p-4 chunky-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal">
              Target wave
            </span>
            <button onClick={playHint} className="text-xs text-teal underline">
              {hintPlaying ? "⏹ stop" : "▶ play"}
            </button>
          </div>
          <canvas ref={refCanvasRef} className="w-full h-24" />
        </div>
        <div className="bg-white/70 rounded-2xl p-4 chunky-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-coral">Your wave</span>
            {score !== null && (
              <span
                className={`text-xs font-bold ${score >= THRESHOLD ? "text-teal" : "text-coral"}`}
              >
                {Math.round(score * 100)}% match
              </span>
            )}
          </div>
          <canvas ref={youCanvasRef} className="w-full h-24" />
        </div>
      </div>
    </LessonShell>
  );
}
