import { Link, useNavigate } from "@tanstack/react-router";
import { BackArrow } from "@/components/icons/BackArrow";

const ACTIVE_CHILD_KEY = "shine.activeChildId";
const ACTIVE_CHILD_NAME_KEY = "shine.activeChildName";
const ACTIVE_CHARACTER_KEY = "shine.activeCharacter";

interface ChildHeaderProps {
  backTo?: string;
  showLogout?: boolean;
}

export function ChildHeader({ backTo, showLogout = true }: ChildHeaderProps) {
  const navigate = useNavigate();

  function endSession() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_CHILD_KEY);
      localStorage.removeItem(ACTIVE_CHILD_NAME_KEY);
      localStorage.removeItem(ACTIVE_CHARACTER_KEY);
    }
    navigate({ to: "/role" });
  }

  return (
    <header className="max-w-5xl mx-auto flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <span className="text-3xl">✨</span>
        <span className="font-bold text-xl tracking-wide">SHINE</span>
      </div>
      <div className="flex items-center gap-3">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/60 hover:text-coral"
            aria-label="Back"
          >
            <BackArrow className="w-4 h-4" />
            Back
          </Link>
        )}
        {showLogout && (
          <button
            onClick={endSession}
            className="px-4 h-10 rounded-2xl bg-white border-2 border-border text-sm font-bold text-foreground/70 hover:text-berry hover:border-berry transition"
          >
            End
          </button>
        )}
      </div>
    </header>
  );
}
