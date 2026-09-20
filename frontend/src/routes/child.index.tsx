import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChildHeader } from "@/components/ChildHeader";
import { apiRequest } from "@/lib/api";

const ACTIVE_CHILD_KEY = "shine.activeChildId";
const ACTIVE_CHILD_NAME_KEY = "shine.activeChildName";

export const Route = createFileRoute("/child/")({
  head: () => ({ meta: [{ title: "Join your class — Shine" }] }),
  component: JoinCodeGate,
});

function JoinCodeGate() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem(ACTIVE_CHILD_KEY);
    const n = localStorage.getItem(ACTIVE_CHILD_NAME_KEY);
    if (id) setName(n);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) {
      setError("Codes are 6 characters.");
      return;
    }
    setBusy(true);
    try {
      // Use backend API endpoint instead of direct Supabase RPC
      const response = await apiRequest<{ child: { id: string; name: string }; success: boolean }>(
        "/api/v1/children/resolve-by-code",
        {
          method: "POST",
          body: JSON.stringify({ join_code: clean }),
        },
      );

      if (!response.success || !response.child?.id) {
        setError("We couldn't find that code. Ask your teacher!");
        return;
      }

      localStorage.setItem(ACTIVE_CHILD_KEY, response.child.id);
      localStorage.setItem(ACTIVE_CHILD_NAME_KEY, response.child.name ?? "");
      navigate({ to: "/child/buddy" });
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function switchChild() {
    localStorage.removeItem(ACTIVE_CHILD_KEY);
    localStorage.removeItem(ACTIVE_CHILD_NAME_KEY);
    setName(null);
    setCode("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky/40 via-cream to-sun/30 p-6">
      <ChildHeader showLogout={true} />

      <main className="max-w-md mx-auto pt-10 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold">Who's playing?</h1>
          <p className="mt-3 text-foreground/70 text-lg">
            Type the 6-letter code from your teacher.
          </p>
        </div>

        {name ? (
          <div className="rounded-3xl bg-white border-4 border-white chunky-shadow p-6 text-center space-y-4">
            <p className="text-foreground/60 text-sm uppercase tracking-wide">Welcome back</p>
            <p className="text-3xl font-bold">{name}</p>
            <div className="flex gap-3 justify-center pt-2">
              <Link
                to="/child/buddy"
                className="px-8 h-12 rounded-2xl bg-coral text-white font-bold chunky-shadow inline-flex items-center"
              >
                Keep playing →
              </Link>
              <button
                onClick={switchChild}
                className="px-6 h-12 rounded-2xl bg-white border-2 border-border font-semibold"
              >
                Not me
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-3xl bg-white border-4 border-white chunky-shadow p-6 space-y-4"
          >
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full text-center text-4xl font-bold tracking-[0.4em] py-4 rounded-2xl bg-muted border-2 border-border focus:outline-none focus:border-coral"
            />
            {error && <p className="text-sm text-berry text-center font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full h-14 rounded-2xl bg-coral text-white font-bold text-lg chunky-shadow disabled:opacity-50"
            >
              {busy ? "Checking…" : "Let's go!"}
            </button>
            <p className="text-xs text-foreground/50 text-center">
              No code yet? Ask your teacher for the code next to your name.
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
