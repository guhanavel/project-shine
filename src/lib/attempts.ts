import { supabase } from "@/integrations/supabase/client";

const ACTIVE_CHILD_KEY = "shine.activeChildId";

export function getActiveChildId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CHILD_KEY);
}

export type LogAttempt = {
  slug: string;
  correct: boolean;
  latencyMs?: number;
  hintsUsed?: number;
  transcript?: string;
  meta?: Record<string, unknown>;
};

/** Fire-and-forget attempt logging. No-ops when no active child or no auth. */
export async function logAttempt(a: LogAttempt): Promise<void> {
  try {
    const childId = getActiveChildId();
    if (!childId) return;
    await supabase.rpc("log_child_attempt", {
      _child_id: childId,
      _activity_slug: a.slug,
      _correct: a.correct,
      _latency_ms: a.latencyMs ?? undefined,
      _hints_used: a.hintsUsed ?? 0,
      _transcript: a.transcript ?? undefined,
      _meta: (a.meta ?? {}) as any,
    });
  } catch {
    // Ignore — logging must never break the child journey.
  }
}
