import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CHARACTERS, type CharacterId, saveCharacter } from "@/lib/characters";
import { useEffect } from "react";
import { useSpeak } from "@/lib/useSpeak";
import { BackArrow } from "@/components/icons/BackArrow";

export const Route = createFileRoute("/child/welcome/$char")({
  head: ({ params }) => ({
    meta: [{ title: `Welcome to ${cap(params.char)}'s world — Shine` }],
  }),
  loader: ({ params }) => {
    if (!(params.char in CHARACTERS)) throw notFound();
    return null;
  },
  component: WelcomeCharacter,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Link to="/child" className="inline-flex items-center gap-2 text-coral font-bold">
        <BackArrow className="w-4 h-4" /> Pick a buddy
      </Link>
    </div>
  ),
});

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function WelcomeCharacter() {
  const params = Route.useParams();
  const char = params.char as CharacterId;
  const c = CHARACTERS[char];
  const { speakIntro, speaking } = useSpeak();

  useEffect(() => {
    saveCharacter(char);
  }, [char]);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${c.bg} relative overflow-hidden`}>
      {c.props.map((p, i) => (
        <span
          key={i}
          className="absolute text-5xl animate-float opacity-90 select-none pointer-events-none"
          style={{
            left: `${((i * 83) % 90) + 4}%`,
            top: `${((i * 47) % 70) + 8}%`,
            animationDelay: `${i * 0.35}s`,
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))",
          }}
        >
          {p}
        </span>
      ))}

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link
          to="/child"
          className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center text-2xl chunky-shadow hover:-translate-x-0.5 transition text-foreground/80 hover:text-coral"
          aria-label="Back"
        >
          <BackArrow className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-md text-center flex-1 mx-4">
          Welcome to {c.name}'s {c.place}
        </h1>
        <button
          className="w-11 h-11 rounded-full bg-foreground text-white flex items-center justify-center chunky-shadow"
          aria-label="Settings"
        >
          ⚙
        </button>
      </header>

      <main className="relative z-10 grid md:grid-cols-[1fr_1.4fr] gap-6 items-center max-w-6xl mx-auto px-6 pb-16">
        <div className="flex justify-center md:justify-end">
          <img src={c.img} alt={c.name} className="w-64 md:w-80 drop-shadow-2xl animate-float" />
        </div>

        <div className="relative">
          <div className={`${c.frame} rounded-full h-4 w-full absolute -top-2 chunky-shadow`} />
          <div className={`${c.frame} rounded-full h-4 w-full absolute -bottom-2 chunky-shadow`} />
          <div className="relative bg-white rounded-3xl px-8 py-8 md:py-10 chunky-shadow border-4 border-white">
            <button
              onClick={() => speakIntro(char)}
              className="absolute -top-5 right-6 w-12 h-12 rounded-full bg-foreground text-white text-xl flex items-center justify-center chunky-shadow"
              aria-label={speaking ? "Stop audio" : "Play audio"}
            >
              {speaking ? "⏹" : "🔊"}
            </button>
            <p className="font-bold text-xl mb-3">Hello, my name is {c.name}.</p>
            <p className="text-foreground/80 leading-relaxed">{c.story}</p>
          </div>
        </div>
      </main>

      <div className="relative z-10 flex justify-center pb-14">
        <Link
          to="/child/phonics"
          className="px-12 h-14 rounded-2xl bg-foreground text-white font-bold text-xl chunky-shadow hover:-translate-y-1 transition inline-flex items-center gap-2"
        >
          Next →
        </Link>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-white/25 backdrop-blur-sm pointer-events-none" />
    </div>
  );
}
