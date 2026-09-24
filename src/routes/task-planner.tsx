import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Lightbulb } from "lucide-react";
import { AppLayout, useGenerating } from "@/components/app-layout";
import { Card, CardHeader, EmptyState, Label, PrimaryButton, TextArea } from "@/components/ui-kit";
import { PageTitle, SkeletonLines } from "./smart-email";
import { planTasks, type TaskPlan } from "@/lib/ai-service";

export const Route = createFileRoute("/task-planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — WorkFlow AI" },
      {
        name: "description",
        content:
          "Braindump your week and get an optimized, prioritized plan with a time optimization tip.",
      },
      { property: "og:title", content: "AI Task Planner — WorkFlow AI" },
      {
        property: "og:description",
        content: "Braindump your week and get a prioritized plan in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaskPlannerPage,
});

const COLUMNS = [
  { key: "high", title: "High Priority / Do Today", accent: "bg-destructive" },
  { key: "medium", title: "Medium Priority / Schedule", accent: "bg-chart-4" },
  { key: "low", title: "Low Priority / Delegate", accent: "bg-chart-2" },
] as const;

function TaskPlannerPage() {
  const { setGenerating } = useGenerating();
  const [braindump, setBraindump] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TaskPlan | null>(null);

  async function handlePlan() {
    if (!braindump.trim()) return;
    setLoading(true);
    setGenerating(true);
    setPlan(null);
    try {
      setPlan(await planTasks(braindump));
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <PageTitle
          icon={<CalendarCheck className="h-5 w-5" />}
          title="AI Task Planner"
          subtitle="Empty your head, get a prioritized week back."
        />

        <Card className="mt-6">
          <CardHeader title="Braindump" description="One task per line — messy is fine." />
          <div className="space-y-4 p-5">
            <div>
              <Label htmlFor="braindump">Braindump your tasks for the week (one per line)</Label>
              <TextArea
                id="braindump"
                rows={8}
                value={braindump}
                onChange={(e) => setBraindump(e.target.value)}
                placeholder={"Finish Q3 report\nCall the supplier\nBook team offsite venue"}
              />
            </div>
            <PrimaryButton onClick={handlePlan} loading={loading} disabled={!braindump.trim()}>
              {loading ? "Optimizing plan…" : "Generate Optimized Plan"}
            </PrimaryButton>
          </div>
        </Card>

        {loading && (
          <Card className="mt-6">
            <CardHeader title="Your Optimized Plan" />
            <SkeletonLines />
          </Card>
        )}

        {!loading && !plan && (
          <Card className="mt-6">
            <CardHeader title="Your Optimized Plan" />
            <EmptyState>Your prioritized board will appear here.</EmptyState>
          </Card>
        )}

        {!loading && plan && (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {COLUMNS.map((col) => (
                <Card key={col.key} className="flex flex-col">
                  <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                    <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                    <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {plan[col.key].length}
                    </span>
                  </div>
                  <ul className="flex-1 space-y-2 p-4">
                    {plan[col.key].map((task, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm"
                      >
                        {task}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-accent px-5 py-4">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-accent-foreground">
                  Time Optimization Tip
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-accent-foreground/90">
                  {plan.optimizationTip}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
