import type { TracingTemplate } from "@/types/tracing";

export const letterSTemplate: TracingTemplate = {
  templateId: "lowercase-s",
  character: "s",
  soundAssetUrl: "/audio/phonics/s.mp3",
  completionThresholdPct: 85,
  strokes: [
    {
      strokeOrder: 1,
      startPoint: { x: 132, y: 34 },
      endPoint: { x: 66, y: 166 },
      expectedPath:
        "M 132 34 C 110 18, 64 24, 59 54 C 53 83, 132 89, 138 117 C 144 147, 96 180, 66 166",
      pathWidthTolerance: 16,
    },
  ],
};
