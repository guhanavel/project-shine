import { createFileRoute, Link } from "@tanstack/react-router";
import { CHARACTERS } from "@/lib/characters";
import shineLogo from "@/assets/shine-logo.svg";

export const Route = createFileRoute("/role")({
  head: () => ({
    meta: [
      { title: "Choose your role — Shine World" },
      {
        name: "description",
        content:
          "Sign in to Shine World. Teachers sign in to manage classes; kids jump straight into the learning adventure.",
      },
    ],
  }),
  component: RolePage,
});

const DOTS = [
  { c: "#7B2CBF", size: 190, top: "-6%", left: "6%" },
  { c: "#0B8A4B", size: 78, top: "2%", left: "34%" },
  { c: "#F7B500", size: 96, top: "-2%", left: "52%" },
  { c: "#2B1E9E", size: 150, top: "-8%", left: "66%" },
  { c: "#D32F2F", size: 62, top: "8%", left: "88%" },
  { c: "#F7B500", size: 170, top: "26%", left: "-6%" },
  { c: "#1279C4", size: 66, top: "58%", left: "3%" },
  { c: "#F7B500", size: 230, top: "52%", left: "82%" },
  { c: "#0B8A4B", size: 130, top: "84%", left: "2%" },
  { c: "#7B2CBF", size: 60, top: "80%", left: "46%" },
];

const CAST = [CHARACTERS.emma, CHARACTERS.aiko, CHARACTERS.gina, CHARACTERS.sidd];

const roles = [
  {
    id: "child",
    label: "CHILD",
    emoji: "🧒",
    color: "bg-[#F7B500]",
    to: "/child" as const,
    blurb: "Start the learning adventure",
  },
  {
    id: "teacher",
    label: "TEACHER",
    emoji: "👩‍🏫",
    color: "bg-[#0B8A4B]",
    to: "/auth" as const,
    blurb: "Manage classes, kids & reports",
  },
];

function RolePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#ECECEC]">
      {/* confetti dots */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {DOTS.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              background: d.c,
              width: d.size,
              height: d.size,
              top: d.top,
              left: d.left,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-[22vh]">
        <img
          src={shineLogo}
          alt="Shine World logo"
          width={652}
          height={415}
          className="mb-2 h-24 w-auto object-contain sm:h-32 md:h-36"
        />
        <h1 className="text-center text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#141414] mb-2">
          Log in as:
        </h1>
        <p className="text-[#141414]/60 mb-8 text-center text-base sm:text-lg">
          Teachers sign in. Kids jump straight into play.
        </p>

        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          {roles.map((r) => (
            <Link
              key={r.id}
              to={r.to}
              className={`${r.color} chunky-shadow hover:-translate-y-1 transition flex flex-col items-center gap-3 rounded-3xl p-8 text-center text-white`}
            >
              <div className="text-6xl">{r.emoji}</div>
              <div className="text-xl font-bold tracking-wide">{r.label}</div>
              <div className="text-sm text-white/85">{r.blurb}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-center gap-2 px-4 sm:gap-8">
        {CAST.map((c) => (
          <img
            key={c.id}
            src={c.img}
            alt={`${c.name}, a Shine World buddy`}
            className="w-1/4 max-w-[230px] object-contain drop-shadow-xl"
            loading="lazy"
          />
        ))}
      </div>
    </main>
  );
}
