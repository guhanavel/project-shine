import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMyRole } from "@/lib/useMyRole";

export const Route = createFileRoute("/_authenticated/teacher/")({
  head: () => ({ meta: [{ title: "Teacher Dashboard — Shine" }] }),
  component: TeacherHome,
});

type ClassRow = { id: string; name: string; created_at: string };
type ChildRow = {
  id: string;
  name: string;
  buddy_id: string | null;
  avatar_emoji: string | null;
  join_code: string | null;
};
type Attempt = { child_id: string; correct: boolean; created_at: string };

function TeacherHome() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const role = useMyRole();

  const classes = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id,name,created_at")
        .order("created_at");
      if (error) throw error;
      return data as ClassRow[];
    },
    enabled: role.data === "teacher" || role.data === "admin",
  });

  const roster = useQuery({
    queryKey: ["teacher-roster"],
    queryFn: async () => {
      const { data: links, error: e1 } = await supabase
        .from("class_children")
        .select("class_id, child_id");
      if (e1) throw e1;
      const ids = Array.from(new Set((links ?? []).map((l) => l.child_id)));
      if (ids.length === 0) return { links: links ?? [], children: [] as ChildRow[] };
      const { data: kids, error: e2 } = await supabase
        .from("children")
        .select("id,name,buddy_id,avatar_emoji,join_code")
        .in("id", ids);
      if (e2) throw e2;
      return { links: links ?? [], children: (kids ?? []) as ChildRow[] };
    },
    enabled: role.data === "teacher" || role.data === "admin",
  });

  const childIds = roster.data?.children.map((c) => c.id) ?? [];
  const attempts7d = useQuery({
    queryKey: ["teacher-attempts-7d", childIds.join(",")],
    queryFn: async () => {
      if (childIds.length === 0) return [] as Attempt[];
      const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("activity_attempts")
        .select("child_id, correct, created_at")
        .in("child_id", childIds)
        .gte("created_at", since);
      if (error) throw error;
      return data as Attempt[];
    },
    enabled: childIds.length > 0,
  });

  const [newClass, setNewClass] = useState("");
  const addClass = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("classes")
        .insert({ teacher_id: u.user.id, name: newClass.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewClass("");
      qc.invalidateQueries({ queryKey: ["teacher-classes"] });
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/", replace: true });
  }

  if (role.isLoading) return <div className="p-8 text-foreground/60">Loading…</div>;
  if (role.data !== "teacher" && role.data !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="text-xl font-bold">Teachers only</div>
          <p className="text-sm text-foreground/60 mt-2">
            Your account isn't a teacher account. Sign up as a teacher from the role screen.
          </p>
          <Link to="/role" className="mt-4 inline-block text-coral font-semibold">
            Back to roles
          </Link>
        </div>
      </div>
    );
  }

  const totalChildren = roster.data?.children.length ?? 0;
  const attempts = attempts7d.data ?? [];
  const activeThisWeek = new Set(attempts.map((a) => a.child_id)).size;
  const attemptsThisWeek = attempts.length;
  const accuracy = attempts.length
    ? Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100)
    : 0;

  // per-class KPIs
  const linksByClass = new Map<string, string[]>();
  for (const l of roster.data?.links ?? []) {
    const arr = linksByClass.get(l.class_id) ?? [];
    arr.push(l.child_id);
    linksByClass.set(l.class_id, arr);
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm text-foreground/50">Teacher</div>
            <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          </div>
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi label="Children" value={totalChildren} tint="bg-coral" />
          <Kpi label="Active (7d)" value={activeThisWeek} tint="bg-teal" />
          <Kpi label="Attempts (7d)" value={attemptsThisWeek} tint="bg-sun" />
          <Kpi label="Accuracy (7d)" value={`${accuracy}%`} tint="bg-primary" />
        </div>

        <Link
          to="/teacher/themes"
          className="block bg-gradient-to-r from-coral/15 via-sun/15 to-teal/15 border-2 border-border/40 rounded-3xl p-5 mb-8 chunky-shadow hover:-translate-y-0.5 transition"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎯</div>
            <div className="flex-1">
              <div className="font-bold text-lg">Practice themes</div>
              <div className="text-sm text-foreground/60">
                Assign a starter theme to a class in one tap — or build your own from recorded
                letters and words.
              </div>
            </div>
            <div className="text-coral font-semibold text-sm hidden md:block">Open →</div>
          </div>
        </Link>

        <div className="bg-card rounded-3xl p-6 chunky-shadow border-2 border-border/40 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your classes</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 h-11 px-4 rounded-xl border-2 border-border/60 bg-background"
              placeholder="New class name (e.g. K2 Blue)"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
            />
            <Button
              variant="coral"
              disabled={!newClass.trim() || addClass.isPending}
              onClick={() => addClass.mutate()}
            >
              Add class
            </Button>
          </div>

          {classes.isLoading ? (
            <div className="text-foreground/60 text-sm">Loading…</div>
          ) : (classes.data ?? []).length === 0 ? (
            <div className="text-foreground/60 text-sm">
              No classes yet. Create one to start adding children.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {(classes.data ?? []).map((c) => {
                const kids = linksByClass.get(c.id) ?? [];
                const classAttempts = attempts.filter((a) => kids.includes(a.child_id));
                const acc = classAttempts.length
                  ? Math.round(
                      (classAttempts.filter((a) => a.correct).length / classAttempts.length) * 100,
                    )
                  : 0;
                return (
                  <Link
                    key={c.id}
                    to="/teacher/class/$classId"
                    params={{ classId: c.id }}
                    className="rounded-2xl border-2 border-border/60 p-4 hover:-translate-y-0.5 transition bg-background"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-lg">{c.name}</div>
                      <div className="text-xs text-foreground/50">{kids.length} kids</div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-border/40 overflow-hidden">
                      <div className="h-full bg-teal" style={{ width: `${acc}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-foreground/60">
                      {classAttempts.length} attempts · {acc}% correct (7d)
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <NeedsAttention
          childIds={childIds}
          attempts={attempts}
          children={roster.data?.children ?? []}
        />
      </div>
    </div>
  );
}

function Kpi({ label, value, tint }: { label: string; value: number | string; tint: string }) {
  return (
    <div className={`rounded-2xl p-4 text-white chunky-shadow ${tint}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function NeedsAttention({
  childIds,
  attempts,
  children,
}: {
  childIds: string[];
  attempts: Attempt[];
  children: ChildRow[];
}) {
  const byChild = new Map<string, { total: number; correct: number; last: string | null }>();
  for (const id of childIds) byChild.set(id, { total: 0, correct: 0, last: null });
  for (const a of attempts) {
    const row = byChild.get(a.child_id);
    if (!row) continue;
    row.total++;
    if (a.correct) row.correct++;
    if (!row.last || a.created_at > row.last) row.last = a.created_at;
  }
  const flagged = children
    .map((c) => ({ child: c, stats: byChild.get(c.id)! }))
    .filter(({ stats }) => stats.total === 0 || stats.correct / Math.max(stats.total, 1) < 0.6)
    .slice(0, 10);

  return (
    <div className="bg-card rounded-3xl p-6 chunky-shadow border-2 border-border/40">
      <h2 className="text-xl font-bold mb-4">Needs attention</h2>
      {flagged.length === 0 ? (
        <div className="text-foreground/60 text-sm">
          Everyone in your classes is on track this week. 🎉
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {flagged.map(({ child, stats }) => {
            const acc = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
            return (
              <li key={child.id} className="py-3 flex items-center gap-3">
                <div className="text-2xl">{child.avatar_emoji ?? "🧒"}</div>
                <div className="flex-1">
                  <div className="font-semibold">{child.name}</div>
                  {child.join_code && (
                    <button
                      type="button"
                      title="Copy join code"
                      onClick={() => navigator.clipboard?.writeText(child.join_code!)}
                      className="mt-0.5 font-mono text-xs font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-muted border border-border/50 hover:border-coral"
                    >
                      {child.join_code}
                    </button>
                  )}
                  <div className="text-xs text-foreground/60">
                    {stats.total === 0
                      ? "No activity in the last 7 days"
                      : `${acc}% correct across ${stats.total} attempts`}
                  </div>
                </div>
                <Link
                  to="/teacher/report/$childId"
                  params={{ childId: child.id }}
                  className="text-coral font-semibold text-sm"
                >
                  View report →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
