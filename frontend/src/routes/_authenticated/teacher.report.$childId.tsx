import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackArrow } from "@/components/icons/BackArrow";

export const Route = createFileRoute("/_authenticated/teacher/report/$childId")({
  head: () => ({ meta: [{ title: "GROW Report — Shine" }] }),
  component: ReportPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-lg font-semibold text-destructive">Could not load report</div>
        <div className="text-sm text-foreground/60 mt-1">{error.message}</div>
        <Link
          to="/teacher"
          className="mt-4 inline-flex items-center gap-2 text-coral font-semibold"
        >
          <BackArrow className="w-4 h-4" /> Back to home
        </Link>
      </div>
    </div>
  ),
});

type Attempt = { id: string; correct: boolean; created_at: string; activity_id: string };
type Activity = { id: string; slug: string; title: string; unit: string; ld_tags: string[] | null };
type LD = { code: string; name: string; color: string | null };

function ReportPage() {
  const { childId } = Route.useParams();

  const child = useQuery({
    queryKey: ["child", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("id", childId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const attempts = useQuery({
    queryKey: ["attempts", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_attempts")
        .select("id, correct, created_at, activity_id")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Attempt[];
    },
  });

  const activities = useQuery({
    queryKey: ["activities-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, slug, title, unit, ld_tags");
      if (error) throw error;
      return data as Activity[];
    },
  });

  const dispositions = useQuery({
    queryKey: ["dispositions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_dispositions")
        .select("code, name, color")
        .order("sort_order");
      if (error) throw error;
      return data as LD[];
    },
  });

  const isLoading =
    child.isLoading || attempts.isLoading || activities.isLoading || dispositions.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground/60">
        Loading…
      </div>
    );
  }

  const acts = activities.data ?? [];
  const attempted = attempts.data ?? [];
  const lds = dispositions.data ?? [];
  const activityById = new Map(acts.map((a) => [a.id, a]));

  const total = attempted.length;
  const correct = attempted.filter((a) => a.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  // per-activity mastery
  const byActivity = new Map<string, { total: number; correct: number }>();
  for (const a of attempted) {
    const rec = byActivity.get(a.activity_id) ?? { total: 0, correct: 0 };
    rec.total += 1;
    if (a.correct) rec.correct += 1;
    byActivity.set(a.activity_id, rec);
  }

  // per-LD mastery
  const byLd = new Map<string, { total: number; correct: number }>();
  for (const a of attempted) {
    const act = activityById.get(a.activity_id);
    if (!act) continue;
    for (const tag of act.ld_tags ?? []) {
      const rec = byLd.get(tag) ?? { total: 0, correct: 0 };
      rec.total += 1;
      if (a.correct) rec.correct += 1;
      byLd.set(tag, rec);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/60">
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-coral"
        >
          <BackArrow className="w-4 h-4" /> Back
        </Link>
        <div className="text-lg font-bold text-coral">SHINE · GROW Report</div>
        <div className="w-16" />
      </header>

      <main className="px-6 py-6 max-w-4xl mx-auto space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-coral/90 to-sun p-8 text-white chunky-shadow">
          <h1 className="text-3xl font-bold">{child.data?.name ?? "Child"}'s progress</h1>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Stat label="Attempts" value={total.toString()} />
            <Stat label="Correct" value={correct.toString()} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Learning Dispositions</h2>
          {lds.length === 0 ? null : (
            <div className="grid sm:grid-cols-2 gap-4">
              {lds.map((ld) => {
                const s = byLd.get(ld.code) ?? { total: 0, correct: 0 };
                const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={ld.code} className="rounded-2xl bg-card border-2 border-border/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ld.color ?? "#999" }}
                        />
                        {ld.name}
                      </div>
                      <div className="text-sm text-foreground/60">
                        {s.correct}/{s.total || 0}
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: ld.color ?? "#999" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Activities</h2>
          <div className="rounded-2xl bg-card border-2 border-border/40 divide-y divide-border/40">
            {acts.length === 0 && <div className="p-4 text-foreground/60">No activities yet.</div>}
            {acts.map((act) => {
              const s = byActivity.get(act.id) ?? { total: 0, correct: 0 };
              const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div key={act.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{act.title}</div>
                    <div className="text-xs text-foreground/50">
                      {act.unit} · {act.slug}
                    </div>
                  </div>
                  <div className="text-sm text-foreground/60 w-20 text-right">
                    {s.correct}/{s.total || 0}
                  </div>
                  <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? "bg-leaf" : pct >= 40 ? "bg-sun" : "bg-berry"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Recent attempts</h2>
          {attempted.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border/60 p-6 text-center text-foreground/60">
              No attempts yet — jump into a lesson to start collecting data.
            </div>
          ) : (
            <div className="rounded-2xl bg-card border-2 border-border/40 divide-y divide-border/40 max-h-96 overflow-auto">
              {attempted.slice(0, 25).map((a) => {
                const act = activityById.get(a.activity_id);
                return (
                  <div key={a.id} className="p-3 flex items-center gap-3 text-sm">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-white ${a.correct ? "bg-leaf" : "bg-berry"}`}
                    >
                      {a.correct ? "✓" : "✗"}
                    </span>
                    <span className="flex-1 truncate">{act?.title ?? "Activity"}</span>
                    <span className="text-foreground/50">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-white/80 uppercase tracking-wide">{label}</div>
    </div>
  );
}
