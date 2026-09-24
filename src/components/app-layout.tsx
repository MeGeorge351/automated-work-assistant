import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Mail, ClipboardList, CalendarCheck, Workflow, Loader2, ShieldAlert, Sparkles, X, Sun, Moon } from "lucide-react";
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

// ---- Hourly motivation bubble ----
const MOTIVATIONS = [
  "Small steps compound. One focused task now beats a perfect plan later.",
  "You've got this — clear the busiest thing first and the day gets lighter.",
  "Progress, not perfection. Ship the draft, then refine.",
  "A quick break is productive too. Stretch, breathe, come back sharper.",
  "Your future self will thank you for the task you finish today.",
  "Deep work beats busy work. Pick one thing and give it your full attention.",
];

const MOTIVATION_INTERVAL = 60 * 60 * 1000; // 1 hour
const INDEX_KEY = "workflow-ai-motivation-index";

function MotivationBubble() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    // Show immediately on open, then once every hour while the app stays open.
    const show = () => {
      const idx = Number(localStorage.getItem(INDEX_KEY)) || 0;
      setMessage(MOTIVATIONS[idx % MOTIVATIONS.length] ?? MOTIVATIONS[0]!);
      localStorage.setItem(INDEX_KEY, String((idx + 1) % MOTIVATIONS.length));
    };

    show();
    const scheduleNext = () => {
      timer = window.setTimeout(() => {
        show();
        scheduleNext();
      }, MOTIVATION_INTERVAL);
    };
    scheduleNext();

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMessage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="motivation-title"
        className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 motion-reduce:animate-none"
      >
        <button
          onClick={() => setMessage(null)}
          aria-label="Dismiss motivation"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 id="motivation-title" className="text-sm font-semibold text-foreground">
              A little boost
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={() => setMessage(null)}>
            Back to it
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Light / dark theme toggle (persisted) ----
const THEME_KEY = "workflow-ai-theme";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [generating, setGenerating] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <LoadingContext.Provider value={{ generating, setGenerating }}>
      <div className="flex min-h-screen bg-background">
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
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {generating && (
                  <span className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </span>
                )}
                <ThemeToggle />
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
      <MotivationBubble />
    </LoadingContext.Provider>
  );
}
