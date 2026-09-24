import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardHeader, Label, TextInput } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/focus-timer")({
  head: () => ({
    meta: [
      { title: "Focus Timer — WorkFlow AI" },
      {
        name: "description",
        content:
          "Pomodoro-style focus timer with editable focus and break durations to structure deep work sessions.",
      },
      { property: "og:title", content: "Focus Timer — WorkFlow AI" },
      {
        property: "og:description",
        content:
          "Pomodoro-style focus timer with editable focus and break durations to structure deep work sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FocusTimerPage,
});

type Phase = "focus" | "break";

const DEFAULT_FOCUS_MIN = 20;
const DEFAULT_BREAK_MIN = 5;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function FocusTimerPage() {
  const [focusMin, setFocusMin] = useState(DEFAULT_FOCUS_MIN);
  const [breakMin, setBreakMin] = useState(DEFAULT_BREAK_MIN);
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MIN * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<number | undefined>(undefined);

  const phaseDuration = (p: Phase) => (p === "focus" ? focusMin : breakMin) * 60;

  // Tick once per second while running.
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        // Phase complete: switch focus <-> break.
        setPhase((p) => {
          const next: Phase = p === "focus" ? "break" : "focus";
          if (p === "break") setCycles((c) => c + 1);
          setSecondsLeft(phaseDuration(next));
          return next;
        });
        return prev;
      });
    }, 1000);
    return () => window.clearInterval(intervalRef.current);
  }, [running, focusMin, breakMin]);

  const applyDuration = (p: Phase, minutes: number) => {
    const clamped = Math.min(180, Math.max(1, minutes || 1));
    if (p === "focus") setFocusMin(clamped);
    else setBreakMin(clamped);
    // If the edited phase is the current one and the timer is idle, reset the clock.
    if (!running && p === phase) setSecondsLeft(clamped * 60);
  };

  const reset = () => {
    setRunning(false);
    setPhase("focus");
    setSecondsLeft(focusMin * 60);
    setCycles(0);
  };

  const total = phaseDuration(phase);
  const progress = total > 0 ? 1 - secondsLeft / total : 0;
  const isFocus = phase === "focus";

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Focus Timer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Work in focused sprints with regular breaks. Adjust the lengths to fit your rhythm.
          </p>
        </div>

        <Card>
          <CardHeader
            title={isFocus ? "Focus time" : "Break time"}
            description={
              isFocus
                ? "Heads-down work. Silence notifications and pick one task."
                : "Step away, stretch, hydrate. The timer switches back automatically."
            }
          />
          <div className="flex flex-col items-center gap-6 px-5 py-8">
            {/* Phase badge */}
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold",
                isFocus ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground",
              )}
            >
              {isFocus ? <Brain className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
              {isFocus ? "Focusing" : "On a break"}
            </span>

            {/* Countdown */}
            <div
              className="text-7xl font-semibold tabular-nums tracking-tight text-foreground"
              role="timer"
              aria-live="off"
              aria-label={`${formatTime(secondsLeft)} remaining`}
            >
              {formatTime(secondsLeft)}
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-1000 ease-linear",
                  isFocus ? "bg-primary" : "bg-accent-foreground/60",
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRunning((r) => !r)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Completed focus cycles: <span className="font-semibold text-foreground">{cycles}</span>
            </p>
          </div>
        </Card>

        {/* Editable durations */}
        <Card>
          <CardHeader
            title="Session lengths"
            description="Changes apply to the current timer when it's paused, and to all future sessions."
          />
          <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="focus-min">Focus length (minutes)</Label>
              <TextInput
                id="focus-min"
                type="number"
                min={1}
                max={180}
                value={focusMin}
                onChange={(e) => applyDuration("focus", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="break-min">Break length (minutes)</Label>
              <TextInput
                id="break-min"
                type="number"
                min={1}
                max={180}
                value={breakMin}
                onChange={(e) => applyDuration("break", Number(e.target.value))}
              />
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
