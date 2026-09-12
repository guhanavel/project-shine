import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMyRole } from "@/lib/useMyRole";
import { BackArrow } from "@/components/icons/BackArrow";

export const Route = createFileRoute("/_authenticated/teacher/themes")({
  head: () => ({
    meta: [
      { title: "Practice Themes — Shine" },
      {
        name: "description",
        content: "Curated phonics practice packs teachers can assign to a class in one tap.",
      },
      { property: "og:title", content: "Practice Themes — Shine" },
      {
        property: "og:description",
        content:
          "Assign starter practice themes or build your own from recorded letters and words.",
      },
    ],
  }),
  component: ThemesPage,
});

// Only offer items that we actually have recordings for.
const LETTER_BANK = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];
const WORD_BANK = [
  "am",
  "an",
  "and",
  "ant",
  "at",
  "did",
  "dip",
  "get",
  "in",
  "it",
  "map",
  "mat",
  "not",
  "on",
  "pin",
  "pit",
  "sap",
  "sit",
  "tap",
  "tin",
  "up",
  "us",
];

const COLORS = ["coral", "teal", "sun", "primary", "berry", "leaf"] as const;

type ThemeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  is_starter: boolean;
  created_by: string | null;
};
type ItemRow = {
  id: string;
  theme_id: string;
  kind: "letter" | "word";
  value: string;
  position: number;
};
type ClassRow = { id: string; name: string };
type AssignRow = { class_id: string; theme_id: string };

function ThemesPage() {
  const qc = useQueryClient();
  const role = useMyRole();

  const themes = useQuery({
    queryKey: ["themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("themes")
        .select("id,slug,title,description,emoji,color,is_starter,created_by")
        .order("is_starter", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ThemeRow[];
    },
    enabled: role.data === "teacher" || role.data === "admin",
  });

  const items = useQuery({
    queryKey: ["theme-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_items")
        .select("id,theme_id,kind,value,position")
        .order("position");
      if (error) throw error;
      return (data ?? []) as ItemRow[];
    },
    enabled: role.data === "teacher" || role.data === "admin",
  });

  const classes = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("created_at");
      if (error) throw error;
      return (data ?? []) as ClassRow[];
    },
    enabled: role.data === "teacher" || role.data === "admin",
  });

  const assignments = useQuery({
    queryKey: ["class-themes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("class_themes").select("class_id,theme_id");
      if (error) throw error;
      return (data ?? []) as AssignRow[];
    },
    enabled: role.data === "teacher" || role.data === "admin",
  });

  const itemsByTheme = useMemo(() => {
    const map = new Map<string, ItemRow[]>();
    for (const it of items.data ?? []) {
      const arr = map.get(it.theme_id) ?? [];
      arr.push(it);
      map.set(it.theme_id, arr);
    }
    return map;
  }, [items.data]);

  const assignedByTheme = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of assignments.data ?? []) {
      const arr = map.get(a.theme_id) ?? [];
      arr.push(a.class_id);
      map.set(a.theme_id, arr);
    }
    return map;
  }, [assignments.data]);

  const toggleAssign = useMutation({
    mutationFn: async ({
      classId,
      themeId,
      assign,
    }: {
      classId: string;
      themeId: string;
      assign: boolean;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (assign) {
        const { error } = await supabase
          .from("class_themes")
          .insert({ class_id: classId, theme_id: themeId, assigned_by: u.user.id });
        if (error && !`${error.message}`.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase
          .from("class_themes")
          .delete()
          .eq("class_id", classId)
          .eq("theme_id", themeId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-themes"] }),
  });

  const deleteTheme = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase.from("themes").delete().eq("id", themeId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["themes"] });
      qc.invalidateQueries({ queryKey: ["theme-items"] });
    },
  });

  const [creating, setCreating] = useState(false);

  if (role.isLoading) return <div className="p-8 text-foreground/60">Loading…</div>;
  if (role.data !== "teacher" && role.data !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="text-xl font-bold">Teachers only</div>
          <Link to="/role" className="mt-4 inline-block text-coral font-semibold">
            Back to roles
          </Link>
        </div>
      </div>
    );
  }

  const starters = (themes.data ?? []).filter((t) => t.is_starter);
  const mine = (themes.data ?? []).filter((t) => !t.is_starter);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to="/teacher"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
            >
              <BackArrow className="w-4 h-4" /> Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">Practice Themes</h1>
            <p className="text-foreground/60 mt-1">
              Curated packs of letters and words your students can practice.
            </p>
          </div>
          <Button variant="coral" onClick={() => setCreating(true)}>
            + New theme
          </Button>
        </div>

        <section className="mb-10">
          <h2 className="text-sm uppercase tracking-widest text-foreground/50 mb-3">
            Starter themes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {starters.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                items={itemsByTheme.get(t.id) ?? []}
                classes={classes.data ?? []}
                assignedClassIds={assignedByTheme.get(t.id) ?? []}
                onToggle={(classId, assign) =>
                  toggleAssign.mutate({ classId, themeId: t.id, assign })
                }
                canDelete={false}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-widest text-foreground/50 mb-3">Your themes</h2>
          {mine.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border/60 rounded-3xl p-8 text-center text-foreground/60">
              You haven't created any themes yet. Tap{" "}
              <span className="font-semibold text-foreground">+ New theme</span> to build one from
              recorded letters and words.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mine.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  items={itemsByTheme.get(t.id) ?? []}
                  classes={classes.data ?? []}
                  assignedClassIds={assignedByTheme.get(t.id) ?? []}
                  onToggle={(classId, assign) =>
                    toggleAssign.mutate({ classId, themeId: t.id, assign })
                  }
                  canDelete
                  onDelete={() => {
                    if (confirm(`Delete "${t.title}"?`)) deleteTheme.mutate(t.id);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {creating && (
          <CreateThemeDialog
            onClose={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              qc.invalidateQueries({ queryKey: ["themes"] });
              qc.invalidateQueries({ queryKey: ["theme-items"] });
            }}
          />
        )}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  items,
  classes,
  assignedClassIds,
  onToggle,
  canDelete,
  onDelete,
}: {
  theme: ThemeRow;
  items: ItemRow[];
  classes: ClassRow[];
  assignedClassIds: string[];
  onToggle: (classId: string, assign: boolean) => void;
  canDelete: boolean;
  onDelete?: () => void;
}) {
  const color = theme.color ?? "coral";
  return (
    <div className="bg-card rounded-3xl p-5 chunky-shadow border-2 border-border/40 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-${color}/20`}
        >
          {theme.emoji ?? "✨"}
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg leading-tight">{theme.title}</div>
          {theme.description && (
            <div className="text-xs text-foreground/60 mt-1">{theme.description}</div>
          )}
          <div className="text-[11px] text-foreground/50 mt-1">{items.length} items</div>
        </div>
        {canDelete && (
          <button onClick={onDelete} className="text-xs text-foreground/40 hover:text-destructive">
            Delete
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {items.slice(0, 12).map((it) => (
          <span
            key={it.id}
            className="text-xs font-mono px-2 py-1 rounded-lg bg-background border border-border/60"
          >
            {it.value}
          </span>
        ))}
        {items.length > 12 && (
          <span className="text-xs text-foreground/50 self-center">+{items.length - 12}</span>
        )}
      </div>

      <div className="border-t border-border/40 pt-3">
        <div className="text-[11px] uppercase tracking-widest text-foreground/50 mb-2">
          Assign to class
        </div>
        {classes.length === 0 ? (
          <div className="text-xs text-foreground/50">
            Create a class first to assign this theme.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const on = assignedClassIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => onToggle(c.id, !on)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition ${
                    on
                      ? "bg-teal text-teal-foreground border-teal"
                      : "bg-background border-border/60 hover:border-teal"
                  }`}
                >
                  {on ? "✓ " : "+ "}
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateThemeDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState<(typeof COLORS)[number]>("coral");
  const [selected, setSelected] = useState<Array<{ kind: "letter" | "word"; value: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (kind: "letter" | "word", value: string) => {
    setSelected((prev) => {
      const has = prev.some((p) => p.kind === kind && p.value === value);
      return has
        ? prev.filter((p) => !(p.kind === kind && p.value === value))
        : [...prev, { kind, value }];
    });
  };

  const submit = async () => {
    setErr(null);
    if (!title.trim()) {
      setErr("Give your theme a title.");
      return;
    }
    if (selected.length === 0) {
      setErr("Pick at least one letter or word.");
      return;
    }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const slug = `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: t, error } = await supabase
        .from("themes")
        .insert({
          slug,
          title: title.trim(),
          description: description.trim() || null,
          emoji,
          color,
          created_by: u.user.id,
          is_starter: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      const rows = selected.map((s, i) => ({
        theme_id: t.id,
        kind: s.kind,
        value: s.value,
        position: i,
      }));
      const { error: e2 } = await supabase.from("theme_items").insert(rows);
      if (e2) throw e2;
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create theme");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl max-w-2xl w-full p-6 chunky-shadow border-2 border-border/40 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">New practice theme</h3>
          <button onClick={onClose} className="text-foreground/60 text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="grid md:grid-cols-[80px_1fr] gap-3 mb-4">
          <input
            className="h-11 px-2 rounded-xl border-2 border-border/60 bg-background text-center text-2xl"
            value={emoji}
            maxLength={2}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <input
            className="h-11 px-4 rounded-xl border-2 border-border/60 bg-background"
            placeholder="Title (e.g. Farm Words)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <input
          className="h-11 w-full px-4 rounded-xl border-2 border-border/60 bg-background mb-4"
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-2">Color</div>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full bg-${c} border-4 ${color === c ? "border-foreground" : "border-transparent"}`}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-2">
            Letters ({LETTER_BANK.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LETTER_BANK.map((l) => {
              const on = selected.some((s) => s.kind === "letter" && s.value === l);
              return (
                <button
                  key={l}
                  onClick={() => toggle("letter", l)}
                  className={`w-9 h-9 rounded-lg font-mono font-bold border-2 ${on ? "bg-coral text-coral-foreground border-coral" : "bg-background border-border/60 hover:border-coral"}`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-2">
            Words ({WORD_BANK.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WORD_BANK.map((w) => {
              const on = selected.some((s) => s.kind === "word" && s.value === w);
              return (
                <button
                  key={w}
                  onClick={() => toggle("word", w)}
                  className={`px-3 h-9 rounded-lg font-mono font-semibold border-2 ${on ? "bg-teal text-teal-foreground border-teal" : "bg-background border-border/60 hover:border-teal"}`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
        {err && <div className="text-xs text-destructive mb-3">{err}</div>}
        <div className="flex justify-between items-center">
          <div className="text-sm text-foreground/60">
            {selected.length} item{selected.length === 1 ? "" : "s"} selected
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="coral" disabled={busy} onClick={submit}>
              {busy ? "Creating…" : "Create theme"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
