import { useEffect, useState } from "react";
import { CHARACTERS, loadCharacter, type Character } from "@/lib/characters";

/** Reads the buddy the child picked; re-reads on focus / storage change. */
export function useBuddy(): Character | null {
  const [id, setId] = useState<ReturnType<typeof loadCharacter>>(null);

  useEffect(() => {
    const read = () => setId(loadCharacter());
    read();
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, []);

  return id ? CHARACTERS[id] : null;
}

/** Small buddy face — used inside lesson headers. */
export function BuddyAvatar({ className = "" }: { className?: string }) {
  const buddy = useBuddy();
  if (!buddy) return null;
  return (
    <div
      className={`relative shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 border-white bg-gradient-to-b ${buddy.bg} chunky-shadow ${className}`}
      title={buddy.name}
    >
      <img
        src={buddy.img}
        alt={buddy.name}
        className="absolute inset-0 w-full h-full object-cover object-top scale-125"
      />
    </div>
  );
}

/**
 * Floating buddy that follows the child through every practice screen and
 * guides them: it speaks the current instruction, and rotates gentle tips
 * while the child is thinking.
 */
export function BuddyCompanion({ message, tips }: { message?: string; tips?: string[] }) {
  const buddy = useBuddy();
  const [show, setShow] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Rotate the tips so the buddy keeps nudging the child along.
  useEffect(() => {
    if (message || !tips || tips.length < 2) return;
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [message, tips]);

  // Pop the bubble open whenever the guidance changes.
  useEffect(() => {
    setShow(true);
    setPulse(true);
    const id = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(id);
  }, [message, tipIndex]);

  if (!buddy) return null;
  const line = message ?? (tips && tips.length ? tips[tipIndex % tips.length] : "You've got this!");

  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-end gap-2 pointer-events-none select-none">
      {show && (
        <div
          key={line}
          className="animate-bounce-in max-w-[240px] rounded-2xl rounded-br-sm bg-white border-2 border-border px-4 py-2 text-sm font-semibold text-foreground/80 chunky-shadow"
        >
          <span className="block text-[10px] uppercase tracking-wider text-coral">
            {buddy.name}
          </span>
          {line}
        </div>
      )}
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={`${buddy.name}, your buddy`}
        className={`pointer-events-auto relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white overflow-hidden bg-gradient-to-b ${buddy.bg} chunky-shadow hover:-translate-y-1 transition ${pulse ? "animate-bounce-in scale-105" : "animate-float"}`}
      >
        <img
          src={buddy.img}
          alt={buddy.name}
          className="absolute inset-0 w-full h-full object-cover object-top scale-110"
        />
      </button>
    </div>
  );
}
