import { resolveAudioUrl } from "./audio";

// Recorded-audio-only cache. No AI/TTS fallback — if a phrase has no
// matching recording, playback is a silent no-op.

export function getCachedUrl(text: string, _voice = "alloy"): string | null {
  return resolveAudioUrl(text);
}

export function prefetchAudio(text: string, _voice = "alloy"): Promise<string | null> {
  return Promise.resolve(resolveAudioUrl(text));
}

type Idle = (cb: () => void) => number;
const idle: Idle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb: () => void) =>
        (
          window as unknown as { requestIdleCallback: (c: () => void) => number }
        ).requestIdleCallback(cb)
    : (cb: () => void) => (typeof window !== "undefined" ? window.setTimeout(cb, 200) : 0);

/** Schedule preloads on the idle queue with light concurrency. */
export function preloadPhrases(texts: string[], voice = "alloy") {
  if (typeof window === "undefined" || !texts.length) return;
  idle(() => {
    const unique = Array.from(new Set(texts.map((t) => t.trim()).filter(Boolean)));
    for (const t of unique) {
      // Local-only: just warm the resolver; no network involved.
      void prefetchAudio(t, voice);
    }
  });
}
