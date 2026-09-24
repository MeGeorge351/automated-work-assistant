import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, ClipboardList, ListChecks } from "lucide-react";
import { AppLayout, useGenerating } from "@/components/app-layout";
import { Card, CardHeader, EmptyState, Label, PrimaryButton, TextArea } from "@/components/ui-kit";
import { PageTitle, SkeletonLines } from "./smart-email";
import { summarizeMeeting, type MeetingSummary } from "@/lib/ai-service";

export const Route = createFileRoute("/meeting-summarizer")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — WorkFlow AI" },
      {
        name: "description",
        content:
          "Turn raw meeting transcripts into an executive summary, owned action items and clear deadlines.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — WorkFlow AI" },
      {
        property: "og:description",
        content: "Turn raw meeting notes into summaries, action items and deadlines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeetingSummarizerPage,
});

function MeetingSummarizerPage() {
  const { setGenerating } = useGenerating();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  async function handleSummarize() {
    if (!notes.trim()) return;
    setLoading(true);
    setGenerating(true);
    setSummary(null);
    setChecked({});
    try {
      setSummary(await summarizeMeeting(notes));
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <PageTitle
          icon={<ClipboardList className="h-5 w-5" />}
          title="Meeting Notes Summarizer"
          subtitle="Paste the mess. Get the summary, the owners and the dates."
        />

        <Card className="mt-6">
          <CardHeader title="Raw Notes" description="Transcript, bullet points or scribbles." />
          <div className="space-y-4 p-5">
            <div>
              <Label htmlFor="notes">Paste raw meeting transcript or notes here</Label>
              <TextArea
                id="notes"
                rows={10}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sarah: We need the timeline updated before Friday…"
              />
            </div>
            <PrimaryButton onClick={handleSummarize} loading={loading} disabled={!notes.trim()}>
              {loading ? "Summarizing…" : "Summarize Notes"}
            </PrimaryButton>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Structured Summary" description="Always verify against the source." />
          {loading && <SkeletonLines />}
          {!loading && !summary && <EmptyState>Your structured summary will appear here.</EmptyState>}
          {!loading && summary && (
            <div className="divide-y divide-border">
              <section className="p-5">
                <h3 className="text-sm font-semibold text-foreground">Executive Summary</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {summary.executiveSummary}
                </p>
              </section>

              <section className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Action Items &amp; Responsibilities
                </h3>
                <ul className="mt-3 space-y-2">
                  {summary.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={!!checked[i]}
                        onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span
                        className={
                          checked[i]
                            ? "text-sm text-muted-foreground line-through"
                            : "text-sm text-foreground"
                        }
                      >
                        <span className="font-medium">{item.owner}</span> — {item.task}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Deadlines
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.deadlines.map((d, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
