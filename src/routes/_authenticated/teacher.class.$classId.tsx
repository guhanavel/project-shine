import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BackArrow } from "@/components/icons/BackArrow";

export const Route = createFileRoute("/_authenticated/teacher/class/$classId")({
  head: () => ({ meta: [{ title: "Class — Shine" }] }),
  component: ClassPage,
});

type ChildRow = {
  id: string;
  name: string;
  buddy_id: string | null;
  avatar_emoji: string | null;
  join_code: string | null;
};
type Attempt = { child_id: string; correct: boolean; created_at: string };

function ClassPage() {
  const { classId } = Route.useParams();
  const qc = useQueryClient();

  const cls = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id,name")
        .eq("id", classId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const roster = useQuery({
    queryKey: ["class-roster", classId],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("class_children")
        .select("child_id")
        .eq("class_id", classId);
      if (error) throw error;
      const ids = (links ?? []).map((l) => l.child_id);
      if (ids.length === 0) return [] as ChildRow[];
      const { data: kids, error: e2 } = await supabase
        .from("children")
        .select("id,name,buddy_id,avatar_emoji,join_code")
        .in("id", ids);
      if (e2) throw e2;
      return kids as ChildRow[];
    },
  });

  const childIds = (roster.data ?? []).map((c) => c.id);
  const attempts = useQuery({
    queryKey: ["class-attempts-7d", classId, childIds.join(",")],
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

  const [code, setCode] = useState("");
  const [addErr, setAddErr] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState<number | "">("");
  const [createErr, setCreateErr] = useState<string | null>(null);

  const createChild = useMutation({
    mutationFn: async () => {
      setCreateErr(null);
      const name = newName.trim();
      if (!name) throw new Error("Enter a name");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: child, error } = await supabase
        .from("children")
        .insert({
          parent_id: u.user.id,
          name,
          age: newAge === "" ? null : Number(newAge),
          avatar_emoji: "🧒",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("class_children")
        .insert({ class_id: classId, child_id: child.id });
      if (e2 && !`${e2.message}`.includes("duplicate")) throw e2;
    },
    onSuccess: () => {
      setNewName("");
      setNewAge("");
      qc.invalidateQueries({ queryKey: ["class-roster", classId] });
      qc.invalidateQueries({ queryKey: ["teacher-roster"] });
    },
    onError: (e: any) => setCreateErr(e?.message ?? "Could not create child"),
  });

  const addByCode = useMutation({
    mutationFn: async () => {
      setAddErr(null);
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) throw new Error("Enter a join code");
      const { data: child, error } = await supabase
        .from("children")
        .select("id")
        .eq("join_code", trimmed)
        .maybeSingle();
      if (error) throw error;
      if (!child) throw new Error("No child with that code");
      const { error: e2 } = await supabase
        .from("class_children")
        .insert({ class_id: classId, child_id: child.id });
      if (e2 && !`${e2.message}`.includes("duplicate")) throw e2;
    },
    onSuccess: () => {
      setCode("");
      qc.invalidateQueries({ queryKey: ["class-roster", classId] });
      qc.invalidateQueries({ queryKey: ["teacher-roster"] });
    },
    onError: (e: any) => setAddErr(e?.message ?? "Could not add child"),
  });

  const removeChild = useMutation({
    mutationFn: async (childId: string) => {
      const { error } = await supabase
        .from("class_children")
        .delete()
        .eq("class_id", classId)
        .eq("child_id", childId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-roster", classId] });
      qc.invalidateQueries({ queryKey: ["teacher-roster"] });
    },
  });

  const themes = useQuery({
    queryKey: ["class-themes-view", classId],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("class_themes")
        .select("theme_id")
        .eq("class_id", classId);
      if (error) throw error;
      const ids = (links ?? []).map((l) => l.theme_id);
      if (ids.length === 0)
        return [] as {
          id: string;
          slug: string;
          title: string;
          emoji: string | null;
          color: string | null;
        }[];
      const { data, error: e2 } = await supabase
        .from("themes")
        .select("id,slug,title,emoji,color")
        .in("id", ids);
      if (e2) throw e2;
      return data ?? [];
    },
  });

  const unassignTheme = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase
        .from("class_themes")
        .delete()
        .eq("class_id", classId)
        .eq("theme_id", themeId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-themes-view", classId] }),
  });

  // per-day chart data
  const days: { label: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), count: 0 });
  }
  for (const a of attempts.data ?? []) {
    const day = new Date(a.created_at);
    day.setHours(0, 0, 0, 0);
    const idx = 6 - Math.round((today.getTime() - day.getTime()) / (24 * 3600_000));
    if (idx >= 0 && idx < 7) days[idx].count++;
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/teacher"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <BackArrow className="w-4 h-4" /> All classes
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">{cls.data?.name ?? "Class"}</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-card rounded-3xl p-6 chunky-shadow border-2 border-border/40">
            <h2 className="text-lg font-bold mb-4">Attempts this week</h2>
            <div className="flex items-end justify-between gap-2 h-40">
              {days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: "8rem" }}>
                    <div
                      className="w-full rounded-t-lg bg-teal"
                      style={{ height: `${(d.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-foreground/60">{d.label}</div>
                  <div className="text-xs font-semibold">{d.count}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-3xl p-6 chunky-shadow border-2 border-border/40 space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-3">Add a new child</h2>
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="col-span-2 h-11 px-3 rounded-xl border-2 border-border/60 bg-background"
                  placeholder="Child's name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <input
                  type="number"
                  min={2}
                  max={12}
                  className="h-11 px-3 rounded-xl border-2 border-border/60 bg-background"
                  placeholder="Age"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <Button
                variant="teal"
                className="mt-2 w-full"
                onClick={() => createChild.mutate()}
                disabled={createChild.isPending || !newName.trim()}
              >
                {createChild.isPending ? "Adding…" : "Add child"}
              </Button>
              {createErr && <div className="text-xs text-destructive mt-2">{createErr}</div>}
            </div>
            <div className="border-t border-border/40 pt-4">
              <h3 className="text-sm font-bold mb-2">Or add by join code</h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-11 px-3 rounded-xl border-2 border-border/60 bg-background uppercase tracking-widest"
                  placeholder="ABC123"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <Button
                  variant="coral"
                  onClick={() => addByCode.mutate()}
                  disabled={addByCode.isPending}
                >
                  Add
                </Button>
              </div>
              {addErr && <div className="text-xs text-destructive mt-2">{addErr}</div>}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-6 chunky-shadow border-2 border-border/40">
          <h2 className="text-lg font-bold mb-4">Roster</h2>
          {roster.isLoading ? (
            <div className="text-foreground/60 text-sm">Loading…</div>
          ) : (roster.data ?? []).length === 0 ? (
            <div className="text-foreground/60 text-sm">
              No children in this class yet. Add one with a join code above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-foreground/60 border-b border-border/40">
                    <th className="py-2">Child</th>
                    <th className="py-2">Join code</th>
                    <th className="py-2">Attempts (7d)</th>
                    <th className="py-2">Accuracy (7d)</th>
                    <th className="py-2">Last active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(roster.data ?? []).map((c) => {
                    const own = (attempts.data ?? []).filter((a) => a.child_id === c.id);
                    const acc = own.length
                      ? Math.round((own.filter((a) => a.correct).length / own.length) * 100)
                      : 0;
                    const last = own.reduce<string | null>(
                      (acc, a) => (!acc || a.created_at > acc ? a.created_at : acc),
                      null,
                    );
                    return (
                      <tr key={c.id} className="border-b border-border/20">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{c.avatar_emoji ?? "🧒"}</span>
                            <span className="font-semibold">{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {c.join_code ? (
                            <button
                              type="button"
                              title="Copy code"
                              onClick={() => navigator.clipboard?.writeText(c.join_code!)}
                              className="font-mono font-bold tracking-widest px-2 py-1 rounded-lg bg-muted border-2 border-border/50 hover:border-coral"
                            >
                              {c.join_code}
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3">{own.length}</td>
                        <td className="py-3">{own.length ? `${acc}%` : "—"}</td>
                        <td className="py-3">{last ? new Date(last).toLocaleDateString() : "—"}</td>
                        <td className="py-3 text-right">
                          <Link
                            to="/teacher/report/$childId"
                            params={{ childId: c.id }}
                            className="text-coral font-semibold mr-3"
                          >
                            Report
                          </Link>
                          <button
                            className="text-xs text-foreground/60 hover:text-destructive"
                            onClick={() => removeChild.mutate(c.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card rounded-3xl p-6 chunky-shadow border-2 border-border/40 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Assigned themes</h2>
              <p className="text-xs text-foreground/60">
                Themes children in this class will see on their home screen.
              </p>
            </div>
            <Link to="/teacher/themes" className="text-coral font-semibold text-sm">
              Manage →
            </Link>
          </div>
          {(themes.data ?? []).length === 0 ? (
            <div className="text-sm text-foreground/60">
              No themes assigned yet. Open{" "}
              <Link to="/teacher/themes" className="text-coral font-semibold">
                Themes
              </Link>{" "}
              and tap this class name on a starter theme.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(themes.data ?? []).map((t) => (
                <span
                  key={t.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-border/60 bg-background text-sm`}
                >
                  <span className="text-lg">{t.emoji ?? "✨"}</span>
                  <span className="font-semibold">{t.title}</span>
                  <button
                    onClick={() => unassignTheme.mutate(t.id)}
                    className="text-foreground/40 hover:text-destructive text-xs ml-1"
                    aria-label={`Unassign ${t.title}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
