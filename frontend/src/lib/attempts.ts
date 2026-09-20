import { apiRequest } from "./api";

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

/** Fire-and-forget attempt logging via backend API. No-ops when no active child or no auth. */
export async function logAttempt(a: LogAttempt): Promise<void> {
  try {
    const childId = getActiveChildId();
    if (!childId) return;

    // Use the backend API endpoint instead of direct Supabase RPC
    await apiRequest("/api/v1/attempts/log", {
      method: "POST",
      body: JSON.stringify({
        child_id: childId,
        activity_slug: a.slug,
        correct: a.correct,
        latency_ms: a.latencyMs ?? undefined,
        hints_used: a.hintsUsed ?? 0,
        transcript: a.transcript ?? undefined,
        meta: a.meta ?? {},
      }),
    });
  } catch {
    // Ignore — logging must never break the child journey.
  }
}
