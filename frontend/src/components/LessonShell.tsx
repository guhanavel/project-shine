import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BackArrow } from "@/components/icons/BackArrow";
import { BuddyAvatar, BuddyCompanion } from "@/components/BuddyCompanion";

export function LessonShell({
  title,
  progress,
  children,
  back = "/child/phonics",
  buddyMessage,
  buddyTips,
}: {
  title: string;
  progress: number;
  children: ReactNode;
  back?: string;
  buddyMessage?: string;
  buddyTips?: string[];
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border/60">
        <Link
          to={back}
          className="w-10 h-10 rounded-full bg-white border-2 border-border flex items-center justify-center hover:bg-muted text-foreground/70 hover:text-coral"
          aria-label="Back"
        >
          <BackArrow />
        </Link>
        <h1 className="text-2xl font-bold text-foreground flex-1">{title}</h1>
        <BuddyAvatar />
        <div className="w-40 h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-coral transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-foreground/60 w-10">{progress}%</span>
      </header>
      <main className="px-6 py-8 pb-32 max-w-4xl mx-auto">{children}</main>
      <BuddyCompanion message={buddyMessage} tips={buddyTips} />
    </div>
  );
}

export function FeedbackBubble({
  variant,
  children,
}: {
  variant: "success" | "error" | "hint";
  children: ReactNode;
}) {
  const styles = {
    success: "bg-leaf/20 text-leaf border-leaf/40",
    error: "bg-berry/15 text-berry border-berry/40",
    hint: "bg-sun/30 text-sun-foreground border-sun/60",
  }[variant];
  const icon = variant === "success" ? "🎉" : variant === "error" ? "✖" : "💡";
  return (
    <div
      className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 font-semibold ${styles} animate-bounce-in`}
    >
      <span className="text-xl">{icon}</span>
      {children}
    </div>
  );
}

export function NextButton({ to, label = "NEXT" }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="group btn-chunky btn-shine inline-flex items-center gap-2 px-8 h-14 bg-coral text-coral-foreground font-bold text-lg uppercase tracking-wide select-none hover:btn-chunky-hover active:btn-chunky-press focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/40"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-8 w-8 bg-white/40 blur-sm opacity-0 group-hover:opacity-100 group-hover:[animation:shine-sweep_900ms_ease-out]"
      />
      <span className="relative">{label}</span>
      <span className="relative transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
