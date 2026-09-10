import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Teacher sign in — Shine" },
      { name: "description", content: "Sign in to Shine to manage your classes and children." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function goHome() {
    navigate({ to: "/teacher", replace: true });
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) goHome();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/teacher",
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) goHome();
      else setErr("Check your email to confirm your account, then sign in.");
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/teacher" },
      });
      if (error) throw error;
      // Browser is redirecting to Google now.
    } catch (e: any) {
      setErr(e?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-3xl p-8 chunky-shadow border-2 border-border/40">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-coral">SHINE</div>
          <h1 className="text-2xl font-bold mt-2">
            {mode === "signin" ? "Welcome back" : "Create your teacher account"}
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Teachers manage classes, add children, and see reports.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="xl"
          className="w-full mb-4"
          onClick={onGoogle}
          disabled={busy}
        >
          Continue with Google
        </Button>

        <div className="relative my-4 text-center text-xs text-foreground/50">
          <span className="bg-card px-2 relative z-10">or</span>
          <div className="absolute inset-x-0 top-1/2 border-t border-border/60" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              className="w-full h-12 px-4 rounded-xl border-2 border-border/60 bg-background"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            className="w-full h-12 px-4 rounded-xl border-2 border-border/60 bg-background"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            className="w-full h-12 px-4 rounded-xl border-2 border-border/60 bg-background"
            placeholder="Password (min 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="text-sm text-destructive">{err}</div>}
          <Button type="submit" variant="coral" size="xl" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="text-center mt-4 text-sm text-foreground/70">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button className="text-coral font-semibold" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="text-coral font-semibold" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/child" className="text-xs text-foreground/50 underline">
            Skip and let a child play
          </Link>
        </div>
      </div>
    </div>
  );
}
