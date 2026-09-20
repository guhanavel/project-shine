import { createFileRoute, Link } from "@tanstack/react-router";
import { CHARACTERS } from "@/lib/characters";
import shineLogo from "@/assets/shine-logo.svg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shine World — Playful English learning for kids" },
      {
        name: "description",
        content:
          "Shine World is a playful phonics and English adventure for young learners. Sign in to start the journey with Emma, Sidd, Aiko and Gina.",
      },
      { property: "og:title", content: "Shine World — Playful English learning for kids" },
      {
        property: "og:description",
        content: "A joyful phonics adventure for young learners. Trace, sound out, read and shine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
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

function LandingPage() {
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

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-[26vh]">
        <img
          src={shineLogo}
          alt="Shine World logo"
          width={652}
          height={415}
          className="mb-2 h-32 w-auto object-contain sm:h-44 md:h-52"
        />
        <h1 className="text-center text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#141414]">
          Shine <span className="text-[#7B2CBF]">World</span>
        </h1>

        <Link
          to="/role"
          className="btn-chunky hover:btn-chunky-hover active:btn-chunky-press mt-8 inline-flex h-16 min-w-[260px] items-center justify-center rounded-full bg-[#7B2CBF] px-10 text-2xl font-semibold text-white"
        >
          Sign in
        </Link>
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
