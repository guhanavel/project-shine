import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { LessonShell, FeedbackBubble, NextButton } from "@/components/LessonShell";
import { useSpeak, usePreloadNextLessons } from "@/lib/useSpeak";
import { useEffect } from "react";
import { logAttempt } from "@/lib/attempts";
import { stepProgress, markComplete } from "@/lib/phonicsProgress";

export const Route = createFileRoute("/child/phonics/trace")({
  head: () => ({ meta: [{ title: "Trace the letter — Shine" }] }),
  component: TracePage,
});

function TracePage() {
  usePreloadNextLessons("trace");
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState(false);
  const drawingRef = useRef(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [done, setDone] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const { speak, speaking } = useSpeak();

  useEffect(() => {
    if (done && score !== null && score >= PASS_THRESHOLD) {
      speak("a. ant.");
      markComplete("trace");
    }
    if (done && score !== null) {
      logAttempt({
        slug: "trace-a",
        correct: score >= PASS_THRESHOLD,
        meta: { matchPct: Math.round(score * 100) },
      });
    }
  }, [done, score, speak]);

  const handleSubmit = () => {
    const s = scoreTrace(paths, "a");
    setScore(s);
    setDone(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && done) return; // NextButton handles nav
      if (e.key.toLowerCase() === "c") {
        setPaths([]);
        setDone(false);
        setCurrent("");
        setScore(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  const pt = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setDrawing(false);
    setCurrent((c) => {
      if (c) setPaths((p) => [...p, c]);
      return "";
    });
  };

  return (
    <LessonShell
      title="TRACE THE LETTER"
      progress={stepProgress("trace")}
      buddyMessage={
        done
          ? score !== null && score >= PASS_THRESHOLD
            ? "Beautiful letter 'a'! You nailed it. 🎉"
            : "Nearly! Clear it and follow the dots again."
          : drawing
            ? "Great — keep following the dots…"
            : paths.length > 0
              ? "Nice stroke! Tap Submit when your 'a' is done."
              : undefined
      }
      buddyTips={[
        "Start on the coral dot.",
        "Follow the dots around, then straight down.",
        "Press C to clear and start fresh anytime.",
      ]}
    >
      <p className="text-center text-foreground/70 mb-6">
        Drag with your mouse to trace.{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">C</kbd> to clear.
      </p>
      <div className="bg-gradient-to-br from-leaf/20 to-sun/30 rounded-3xl p-6 relative chunky-shadow mx-auto w-full max-w-[520px]">
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid meet"
          className="w-full aspect-square touch-none cursor-crosshair select-none"
          onPointerDown={(e) => {
            e.preventDefault();
            svgRef.current?.setPointerCapture?.(e.pointerId);
            drawingRef.current = true;
            setDrawing(true);
            setCurrent(`M${pt(e)}`);
          }}
          onPointerMove={(e) => {
            if (!drawingRef.current) return;
            setCurrent((c) => `${c} L${pt(e)}`);
          }}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onLostPointerCapture={endStroke}
        >
          <text
            x="200"
            y="320"
            textAnchor="middle"
            fontSize="360"
            fontWeight="700"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="4"
            strokeDasharray="10 8"
          >
            a
          </text>
          {GUIDE_DOTS_A.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === 0 ? 10 : 7}
              fill={i === 0 ? "var(--color-coral)" : "var(--color-border)"}
              stroke="white"
              strokeWidth="2"
            />
          ))}
          {done && (
            <text
              x="200"
              y="320"
              textAnchor="middle"
              fontSize="360"
              fontWeight="700"
              fill="var(--color-coral)"
            >
              a
            </text>
          )}
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="var(--color-coral)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
          ))}
          {current && (
            <path
              d={current}
              stroke="var(--color-coral)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </svg>
        {done && <div className="absolute top-6 right-6 text-6xl animate-bounce-in">🐜</div>}
      </div>
      <div className="flex flex-wrap gap-4 justify-center mt-6 items-center">
        <button
          onClick={() => speak("a. ant.")}
          disabled={speaking}
          className="px-6 h-12 rounded-2xl bg-white border-2 border-border font-semibold hover:bg-muted inline-flex items-center gap-2"
        >
          {speaking ? "🎧" : "🔊"} Hear it
        </button>
        <button
          onClick={() => {
            setPaths([]);
            setDone(false);
            setScore(null);
            setCurrent("");
          }}
          className="px-6 h-12 rounded-2xl bg-white border-2 border-border font-semibold hover:bg-muted"
        >
          Clear
        </button>
        {!done && (
          <button
            onClick={handleSubmit}
            disabled={paths.length === 0}
            className="px-6 h-12 rounded-2xl bg-coral text-white font-bold btn-chunky disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✓ Submit
          </button>
        )}
        {done && (
          <>
            {score !== null && score >= PASS_THRESHOLD ? (
              <>
                <FeedbackBubble variant="success">
                  {Math.round(score * 100)}% match — awesome!
                </FeedbackBubble>
                <NextButton to="/child/phonics/sound" label="NEXT: LISTEN" />
              </>
            ) : (
              <>
                <FeedbackBubble variant="error">
                  {Math.round((score ?? 0) * 100)}% match — try again, stay on the dashes!
                </FeedbackBubble>
                <button
                  onClick={() => {
                    setPaths([]);
                    setDone(false);
                    setScore(null);
                    setCurrent("");
                  }}
                  className="px-6 h-12 rounded-2xl bg-coral text-white font-bold btn-chunky"
                >
                  Try again
                </button>
              </>
            )}
          </>
        )}
      </div>
      {done && score !== null && score >= PASS_THRESHOLD && (
        <p className="text-center mt-4 text-2xl font-bold text-coral">ant</p>
      )}
    </LessonShell>
  );
}

const PASS_THRESHOLD = 0.35;

// Guide dots along the lowercase "a" stroke path (viewBox 400x400).
// Order: trace the round bowl counter-clockwise starting top-right,
// then the descending tail on the right side.
const GUIDE_DOTS_A: { x: number; y: number }[] = [
  { x: 250, y: 180 }, // 1 — start (top-right of bowl)
  { x: 205, y: 165 }, // 2 — top
  { x: 160, y: 190 }, // 3 — upper-left
  { x: 145, y: 240 }, // 4 — left
  { x: 165, y: 290 }, // 5 — lower-left
  { x: 215, y: 305 }, // 6 — bottom
  { x: 255, y: 285 }, // 7 — close bowl (right)
  { x: 260, y: 200 }, // 8 — tail top
  { x: 260, y: 310 }, // 9 — tail bottom
];

/** Rasterize the target glyph and user's strokes to compare overlap (F1 score). */
function scoreTrace(paths: string[], letter: string): number {
  if (typeof document === "undefined" || paths.length === 0) return 0;
  const SIZE = 200;
  const SCALE = SIZE / 400;

  // Target canvas: fill the glyph
  const t = document.createElement("canvas");
  t.width = t.height = SIZE;
  const tc = t.getContext("2d")!;
  tc.fillStyle = "#000";
  tc.textAlign = "center";
  tc.font = `700 ${360 * SCALE}px sans-serif`;
  tc.fillText(letter, 200 * SCALE, 320 * SCALE);

  // User canvas: stroke user paths
  const u = document.createElement("canvas");
  u.width = u.height = SIZE;
  const uc = u.getContext("2d")!;
  uc.strokeStyle = "#000";
  uc.lineWidth = 14 * SCALE;
  uc.lineCap = "round";
  uc.lineJoin = "round";
  for (const d of paths) {
    try {
      const p = new Path2D();
      // Parse "Mx,y Lx,y ..." into canvas commands via scaling
      const scaled = d.replace(
        /([ML])(-?\d+\.?\d*),(-?\d+\.?\d*)/g,
        (_, cmd, x, y) => `${cmd}${+x * SCALE},${+y * SCALE}`,
      );
      p.addPath(new Path2D(scaled));
      uc.stroke(p);
    } catch {
      /* ignore malformed */
    }
  }

  const tData = tc.getImageData(0, 0, SIZE, SIZE).data;
  const uData = uc.getImageData(0, 0, SIZE, SIZE).data;

  let tPix = 0,
    uPix = 0,
    overlap = 0;
  for (let i = 3; i < tData.length; i += 4) {
    const tOn = tData[i] > 20;
    const uOn = uData[i] > 20;
    if (tOn) tPix++;
    if (uOn) uPix++;
    if (tOn && uOn) overlap++;
  }
  if (!tPix || !uPix) return 0;
  const coverage = overlap / tPix; // how much of the letter was covered
  const precision = overlap / uPix; // how much of the drawing stayed on the letter
  return (2 * coverage * precision) / (coverage + precision); // F1
}
