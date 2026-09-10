// Central manifest of which phrases each lesson plays.
// Used to preload the next lesson(s) in the background.
export const lessonPhrases = {
  pronounce: ["sss. sun."],
  trace: ["a. ant."],
  sound: ["mmm", "i", "m", "d", "n"],
  read: ["n", "a", "p", "nap"],
  decode: ["d", "i", "g", "dig"],
} as const;

export type LessonKey = keyof typeof lessonPhrases;

// Order children advance through — used to pick the "next" lessons to warm.
export const lessonOrder: LessonKey[] = ["pronounce", "trace", "sound", "read", "decode"];

/** Return phrases for the next N lessons after `current` (flattened). */
export function upcomingPhrases(current: LessonKey, count = 2): string[] {
  const idx = lessonOrder.indexOf(current);
  if (idx === -1) return [];
  const next = lessonOrder.slice(idx + 1, idx + 1 + count);
  return next.flatMap((k) => [...lessonPhrases[k]]);
}
