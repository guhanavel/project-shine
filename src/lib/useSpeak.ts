import { useCallback, useEffect, useRef, useState } from "react";
import { resolveIntroUrl } from "./audio";
import { getCachedUrl, prefetchAudio, preloadPhrases } from "./audioCache";
import { upcomingPhrases, type LessonKey } from "./lessonAudio";

function speakNative(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

export function useSpeak() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    setSpeaking(false);
  }, []);

  const play = useCallback(async (src: string) => {
    const audio = new Audio(src);
    audioRef.current = audio;
    await audio.play().catch(() => {});
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.onpause = () => resolve();
    });
    if (audioRef.current === audio) audioRef.current = null;
  }, []);

  const speak = useCallback(
    async (text: string, voice: string = "alloy") => {
      // Second tap while playing = stop.
      if (
        audioRef.current ||
        (typeof window !== "undefined" &&
          "speechSynthesis" in window &&
          window.speechSynthesis.speaking)
      ) {
        stop();
        return;
      }
      try {
        setSpeaking(true);
        // Hit the shared cache first (recorded asset OR pre-fetched TTS blob).
        const cached = getCachedUrl(text, voice);
        if (cached) {
          await play(cached);
          return;
        }
        const url = await prefetchAudio(text, voice);
        if (url) {
          await play(url);
          return;
        }
        // Fallback: no recording for the whole word — use the browser's
        // built-in speech synthesis so we still play the word, not letters.
        await speakNative(text);
      } catch {
        // Silent fail — the UI still works without audio.
      } finally {
        setSpeaking(false);
      }
    },
    [play, stop],
  );

  const speakIntro = useCallback(
    async (characterId: string) => {
      const url = resolveIntroUrl(characterId);
      if (!url) return;
      if (audioRef.current) {
        stop();
        return;
      }
      try {
        setSpeaking(true);
        await play(url);
      } finally {
        setSpeaking(false);
      }
    },
    [play, stop],
  );

  return { speak, speakIntro, stop, speaking };
}

/**
 * Warm the audio cache for the next few lessons after mount.
 * Runs on the idle queue so it never competes with the current interaction.
 */
export function usePreloadNextLessons(current: LessonKey, count = 2) {
  useEffect(() => {
    preloadPhrases(upcomingPhrases(current, count));
  }, [current, count]);
}
