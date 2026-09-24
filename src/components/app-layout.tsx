import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Mail, ClipboardList, CalendarCheck, Workflow, Loader2, ShieldAlert, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Centralized loading state: any tool can register itself as "generating"
// and the header shows a global spinner indicator.
const LoadingContext = createContext<{
  generating: boolean;
  setGenerating: (v: boolean) => void;
}>({ generating: false, setGenerating: () => {} });

export function useGenerating() {
  return useContext(LoadingContext);
}

const NAV_ITEMS = [
  { to: "/smart-email", label: "Smart Email", icon: Mail },
  { to: "/meeting-summarizer", label: "Meeting Summarizer", icon: ClipboardList },
  { to: "/task-planner", label: "Task Planner", icon: CalendarCheck },
] as const;

const MOTIVATIONS = [
  "Small, focused steps create meaningful progress.",
  "You do not have to finish everything — just move the right thing forward.",
  "Take a breath. Clear thinking is productive work, too.",
  "Progress counts, even when it feels quiet.",
  "Protect your focus. The next important step is enough.",
  "You are building momentum, one thoughtful action at a time.",
] as const;

const MOTIVATION_INTERVAL = 60 * 60 * 1000;
const NEXT_MOTIVATION_KEY = "workflow-ai-next-motivation";
const MOTIVATION_INDEX_KEY = "workflow-ai-motivation-index";

function MotivationBubble() {
  const [visible, setVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const storedTime = Number(window.localStorage.getItem(NEXT_MOTIVATION_KEY));
      const nextTime = Number.isFinite(storedTime) && storedTime > 0
        ? storedTime
        : Date.now() + MOTIVATION_INTERVAL;

      window.localStorage.setItem(NEXT_MOTIVATION_KEY, String(nextTime));
      const delay = Math.max(0, nextTime - Date.now());

      timer = window.setTimeout(() => {
        const storedIndex = Number(window.localStorage.getItem(MOTIVATION_INDEX_KEY));
        const nextIndex = Number.isFinite(storedIndex)
          ? (storedIndex + 1) % MOTIVATIONS.length
          : 0;

        setMessageIndex(nextIndex);
        setVisible(true);
        window.localStorage.setItem(MOTIVATION_INDEX_KEY, String(nextIndex));
        window.localStorage.setItem(
          NEXT_MOTIVATION_KEY,
          String(Date.now() + MOTIVATION_INTERVAL),
        );
        schedule();
      }, delay);
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 px-4 backdrop-blur-[2px] animate-in fade-in duration-200">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="motivation-title"
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-popover p-7 text-center shadow-xl animate-in zoom-in-95 duration-200 motion-reduce:animate-none"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible(false)}
          aria-label="Dismiss motivation"
          className="absolute right-3 top-3 text-muted-foreground"
        >
          <X />
        </Button>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Sparkles className="h-5 w-5" />
        </span>
        <p id="motivation-title" className="mt-5 text-xs font-semibold uppercase text-primary">
          A moment for you
        </p>
        <p className="mt-2 text-lg font-medium leading-relaxed text-popover-foreground">
          {MOTIVATIONS[messageIndex]}
        </p>
        <Button type="button" onClick={() => setVisible(false)} className="mt-6">
          Back to it
        </Button>
      </section>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [generating, setGenerating] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <LoadingContext.Provider value={{ generating, setGenerating }}>
      <div className="flex min-h-screen bg-background">
        <MotivationBubble />
        {/* Left sidebar */}
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar">
          <Link to="/" className="flex items-center gap-2.5 border-b border-border px-5 py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Workflow className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">WorkFlow AI</span>
          </Link>
          <nav className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4 text-xs text-muted-foreground">
            Automate the busywork. Keep the judgment.
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top header */}
          <header className="sticky top-0 z-10 border-b border-border bg-card">
            <div className="flex items-center justify-between px-6 py-3">
              <h1 className="text-base font-semibold text-foreground">WorkFlow AI</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {generating && (
                  <span className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </span>
                )}
              </div>
            </div>
            {/* Responsible AI disclaimer banner */}
            <div className="flex items-center gap-2 border-t border-border bg-accent px-6 py-2 text-xs text-accent-foreground">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <p>
                AI outputs are generated by models and may contain errors or biases. Always review
                and validate content before professional use.
              </p>
            </div>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </LoadingContext.Provider>
  );
}
