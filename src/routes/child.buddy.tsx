import { createFileRoute, Link } from "@tanstack/react-router";
import { CHARACTER_LIST, saveCharacter } from "@/lib/characters";
import { ChildHeader } from "@/components/ChildHeader";

export const Route = createFileRoute("/child/buddy")({
  head: () => ({ meta: [{ title: "Pick your buddy — Shine" }] }),
  component: ChildPicker,
});

function ChildPicker() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky/40 via-cream to-sun/30 p-6">
      <ChildHeader backTo="/child" showLogout={true} />
      <main className="max-w-5xl mx-auto pt-6 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold">Pick your buddy!</h1>
          <p className="mt-3 text-foreground/70 text-lg">
            Choose a friend to learn English with on your adventure.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {CHARACTER_LIST.map((c) => (
            <Link
              key={c.id}
              to="/child/welcome/$char"
              params={{ char: c.id }}
              onClick={() => saveCharacter(c.id)}
              className={`group relative rounded-3xl bg-gradient-to-b ${c.bg} p-4 pt-6 chunky-shadow border-4 border-white/70 overflow-hidden hover:-translate-y-1 transition`}
            >
              <div className="absolute inset-x-0 top-0 h-24 opacity-40 pointer-events-none">
                {c.props.slice(0, 4).map((p, i) => (
                  <span
                    key={i}
                    className="absolute text-2xl animate-float"
                    style={{
                      left: `${10 + i * 22}%`,
                      top: `${(i % 2) * 20 + 6}px`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="relative flex items-end justify-center h-48">
                <img
                  src={c.img}
                  alt={c.name}
                  className="max-h-full drop-shadow-xl group-hover:scale-105 transition"
                />
              </div>
              <div className="relative mt-3 bg-white rounded-2xl px-4 py-3 text-center chunky-shadow">
                <p className="font-bold text-lg">{c.name}</p>
                <p className="text-xs text-foreground/60">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
