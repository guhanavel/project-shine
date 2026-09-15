// Single source of truth for the child phonics journey: order, labels,
// progress %, and which steps a child has already finished on this device.

export const PHONICS_STEPS = [
  {
    key: "pronounce",
    n: 1,
    title: "Pronounce",
    subtitle: "Say the sound",
    emoji: "🔊",
    to: "/child/phonics/pronounce",
    color: "bg-coral",
  },
  {
    key: "trace",
    n: 2,
    title: "Trace",
    subtitle: "Write the letter",
    emoji: "✏️",
    to: "/child/phonics/trace",
    color: "bg-sun",
  },
  {
    key: "sound",
    n: 3,
    title: "Listen",
    subtitle: "Spot the sound",
    emoji: "👂",
    to: "/child/phonics/sound",
    color: "bg-berry",
  },
  {
    key: "read",
    n: 4,
    title: "Read",
    subtitle: "Blend a word",
    emoji: "📖",
    to: "/child/phonics/read",
    color: "bg-leaf",
  },
  {
    key: "decode",
    n: 5,
    title: "Decode",
    subtitle: "Crack a new word",
    emoji: "🕵️",
    to: "/child/phonics/decode",
    color: "bg-teal",
  },
] as const;

export type PhonicsStepKey = (typeof PHONICS_STEPS)[number]["key"];

/** 0-100 progress shown in the lesson header when this step is in play. */
export function stepProgress(key: PhonicsStepKey): number {
  const i = PHONICS_STEPS.findIndex((s) => s.key === key);
  return Math.round(((i + 1) / PHONICS_STEPS.length) * 100);
}

export function nextStep(key: PhonicsStepKey) {
  const i = PHONICS_STEPS.findIndex((s) => s.key === key);
  return PHONICS_STEPS[i + 1] ?? null;
}

function storageKey() {
  const child = typeof window !== "undefined" ? localStorage.getItem("shine.activeChildId") : null;
  return `shine.phonics.done.${child ?? "guest"}`;
}

export function getCompleted(): PhonicsStepKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey());
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return list.filter((k): k is PhonicsStepKey => PHONICS_STEPS.some((s) => s.key === k));
  } catch {
    return [];
  }
}

export function markComplete(key: PhonicsStepKey) {
  if (typeof window === "undefined") return;
  const set = new Set(getCompleted());
  set.add(key);
  try {
    localStorage.setItem(storageKey(), JSON.stringify([...set]));
    window.dispatchEvent(new Event("shine:phonics-progress"));
  } catch {
    /* ignore */
  }
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey());
    window.dispatchEvent(new Event("shine:phonics-progress"));
  } catch {
    /* ignore */
  }
}

/** First step the child has not finished yet (null when the journey is done). */
export function firstIncomplete() {
  const done = new Set(getCompleted());
  return PHONICS_STEPS.find((s) => !done.has(s.key)) ?? null;
}
