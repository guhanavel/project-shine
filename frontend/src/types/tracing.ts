export interface TracingPoint {
  x: number;
  y: number;
}

export interface TracingStroke {
  strokeOrder: number;
  startPoint: TracingPoint;
  endPoint: TracingPoint;
  expectedPath: string;
  pathWidthTolerance: number;
}

export interface TracingTemplate {
  templateId: string;
  character: string;
  soundAssetUrl: string;
  completionThresholdPct: number;
  strokes: TracingStroke[];
}
