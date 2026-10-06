import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { TracingPoint, TracingTemplate } from "@/types/tracing";

const SAMPLE_SPACING = 5;

interface TracingCanvasProps {
  template: TracingTemplate;
  onComplete: (coveragePct: number) => void;
}

export function TracingCanvas({ template, onComplete }: TracingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const guideRefs = useRef<(SVGPathElement | null)[]>([]);
  const activePointerId = useRef<number | null>(null);
  const activePointsRef = useRef<TracingPoint[]>([]);
  const [drawnStrokes, setDrawnStrokes] = useState<TracingPoint[][]>([]);
  const [activePoints, setActivePoints] = useState<TracingPoint[]>([]);
  const [coveragePct, setCoveragePct] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [boundaryMessage, setBoundaryMessage] = useState("");

  const pointFromEvent = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  };

  const measureCoverage = (strokes: TracingPoint[][]) => {
    let totalSamples = 0;
    let coveredSamples = 0;

    template.strokes.forEach((stroke, strokeIndex) => {
      const guide = guideRefs.current[strokeIndex];
      if (!guide) return;

      const length = guide.getTotalLength();
      const sampleCount = Math.max(1, Math.ceil(length / SAMPLE_SPACING));
      const toleranceSquared = stroke.pathWidthTolerance ** 2;

      for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
        const sample = guide.getPointAtLength((length * sampleIndex) / sampleCount);
        totalSamples += 1;
        if (
          strokes.some((drawnStroke) => isPointNearStroke(sample, drawnStroke, toleranceSquared))
        ) {
          coveredSamples += 1;
        }
      }
    });

    return totalSamples === 0 ? 0 : (coveredSamples / totalSamples) * 100;
  };

  const restartAtStart = (pointerId?: number) => {
    if (pointerId !== undefined && svgRef.current?.hasPointerCapture(pointerId)) {
      svgRef.current.releasePointerCapture(pointerId);
    }
    activePointerId.current = null;
    activePointsRef.current = [];
    setDrawnStrokes([]);
    setActivePoints([]);
    setCoveragePct(0);
    setSubmitted(false);
    setBoundaryMessage("That stroke left the guide. Start again at the coral dot.");
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    const stroke = template.strokes[drawnStrokes.length];
    const guide = guideRefs.current[drawnStrokes.length];
    const point = pointFromEvent(event);
    if (!point || !stroke || !guide) return;

    const toleranceSquared = stroke.pathWidthTolerance ** 2;
    if (
      squaredDistance(point, stroke.startPoint) > toleranceSquared ||
      !isPointNearGuide(point, guide, toleranceSquared)
    ) {
      setBoundaryMessage("Start at the coral dot to trace the letter.");
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerId.current = event.pointerId;
    activePointsRef.current = [point];
    setActivePoints([point]);
    setBoundaryMessage("");
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current !== event.pointerId) return;
    const point = pointFromEvent(event);
    if (!point) return;

    const stroke = template.strokes[drawnStrokes.length];
    const guide = guideRefs.current[drawnStrokes.length];
    const previousPoint = activePointsRef.current[activePointsRef.current.length - 1];
    if (
      !stroke ||
      !guide ||
      !previousPoint ||
      !isSegmentWithinGuide(previousPoint, point, guide, stroke.pathWidthTolerance)
    ) {
      restartAtStart(event.pointerId);
      return;
    }

    const nextPoints = [...activePointsRef.current, point];
    activePointsRef.current = nextPoints;
    setActivePoints(nextPoints);
    setCoveragePct(measureCoverage([...drawnStrokes, nextPoints]));
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    const stroke = template.strokes[drawnStrokes.length];
    const guide = guideRefs.current[drawnStrokes.length];
    const finalPoint = pointFromEvent(event);
    const previousPoint = activePointsRef.current[activePointsRef.current.length - 1];
    if (
      !stroke ||
      !guide ||
      !finalPoint ||
      !previousPoint ||
      !isSegmentWithinGuide(previousPoint, finalPoint, guide, stroke.pathWidthTolerance) ||
      squaredDistance(finalPoint, stroke.endPoint) > stroke.pathWidthTolerance ** 2
    ) {
      restartAtStart();
      return;
    }

    const finishedStroke = finalPoint
      ? [...activePointsRef.current, finalPoint]
      : activePointsRef.current;
    const nextStrokes = [...drawnStrokes, finishedStroke];

    activePointerId.current = null;
    activePointsRef.current = [];
    setDrawnStrokes(nextStrokes);
    setActivePoints([]);
    setCoveragePct(measureCoverage(nextStrokes));
  };

  const handlePointerCancel = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current === event.pointerId) restartAtStart();
  };

  const allDrawnStrokes = [...drawnStrokes, ...(activePoints.length > 0 ? [activePoints] : [])];
  const canSubmit =
    !submitted &&
    drawnStrokes.length === template.strokes.length &&
    coveragePct >= template.completionThresholdPct;

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="rounded-3xl bg-gradient-to-br from-leaf/20 to-sun/30 p-4 sm:p-6 chunky-shadow">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          preserveAspectRatio="xMidYMid meet"
          className="aspect-square w-full touch-none cursor-crosshair select-none"
          role="img"
          aria-label={`Trace the letter ${template.character}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
        >
          {template.strokes.map((stroke, index) => (
            <g key={stroke.strokeOrder}>
              <path
                ref={(node) => {
                  guideRefs.current[index] = node;
                }}
                d={stroke.expectedPath}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="20"
                strokeDasharray="1 13"
                strokeLinecap="round"
              />
              <circle
                cx={stroke.startPoint.x}
                cy={stroke.startPoint.y}
                r="12"
                fill="var(--color-coral)"
                stroke="white"
                strokeWidth="3"
              />
            </g>
          ))}
          {allDrawnStrokes.map((stroke, index) => (
            <path
              key={index}
              d={pointsToPath(stroke)}
              fill="none"
              stroke="var(--color-coral)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <p className="text-sm font-semibold text-foreground/70" aria-live="polite">
          {Math.floor(coveragePct)}% traced
        </p>
        {boundaryMessage && (
          <p className="text-sm font-semibold text-destructive" role="status">
            {boundaryMessage}
          </p>
        )}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            setSubmitted(true);
            onComplete(coveragePct);
          }}
          className="btn-chunky h-12 rounded-2xl bg-coral px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitted ? "Traced!" : "I traced it"}
        </button>
      </div>
    </div>
  );
}

function pointsToPath(points: TracingPoint[]) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function isPointNearGuide(point: TracingPoint, guide: SVGPathElement, toleranceSquared: number) {
  const length = guide.getTotalLength();
  const sampleCount = Math.max(1, Math.ceil(length / SAMPLE_SPACING));
  let previousPoint = guide.getPointAtLength(0);

  for (let index = 1; index <= sampleCount; index += 1) {
    const sample = guide.getPointAtLength((length * index) / sampleCount);
    if (squaredDistanceToSegment(point, previousPoint, sample) <= toleranceSquared) {
      return true;
    }
    previousPoint = sample;
  }
  return false;
}

function isSegmentWithinGuide(
  start: TracingPoint,
  end: TracingPoint,
  guide: SVGPathElement,
  tolerance: number,
) {
  const distance = Math.sqrt(squaredDistance(start, end));
  const sampleCount = Math.max(1, Math.ceil(distance / SAMPLE_SPACING));
  const toleranceSquared = tolerance ** 2;

  for (let index = 0; index <= sampleCount; index += 1) {
    const fraction = index / sampleCount;
    const point = {
      x: start.x + (end.x - start.x) * fraction,
      y: start.y + (end.y - start.y) * fraction,
    };
    if (!isPointNearGuide(point, guide, toleranceSquared)) return false;
  }
  return true;
}

function isPointNearStroke(point: TracingPoint, stroke: TracingPoint[], toleranceSquared: number) {
  if (stroke.length === 0) return false;
  if (stroke.length === 1) return squaredDistance(point, stroke[0]) <= toleranceSquared;

  for (let index = 1; index < stroke.length; index += 1) {
    if (squaredDistanceToSegment(point, stroke[index - 1], stroke[index]) <= toleranceSquared) {
      return true;
    }
  }
  return false;
}

function squaredDistanceToSegment(point: TracingPoint, start: TracingPoint, end: TracingPoint) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const segmentLengthSquared = deltaX ** 2 + deltaY ** 2;
  if (segmentLengthSquared === 0) return squaredDistance(point, start);

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / segmentLengthSquared,
    ),
  );
  return squaredDistance(point, {
    x: start.x + projection * deltaX,
    y: start.y + projection * deltaY,
  });
}

function squaredDistance(first: TracingPoint, second: TracingPoint) {
  return (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
}
