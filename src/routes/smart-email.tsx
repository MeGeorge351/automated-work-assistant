import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { AppLayout, useGenerating } from "@/components/app-layout";
import {
  Card,
  CardHeader,
  EmptyState,
  Label,
  PrimaryButton,
  Select,
  TextArea,
} from "@/components/ui-kit";
import {
  generateEmail,
  type EmailAudience,
  type EmailTone,
  type GeneratedEmail,
} from "@/lib/ai-service";

export const Route = createFileRoute("/smart-email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — WorkFlow AI" },
      {
        name: "description",
        content:
          "Draft polished professional emails in seconds. Set the context, tone and audience and let WorkFlow AI write the first draft.",
      },
      { property: "og:title", content: "Smart Email Generator — WorkFlow AI" },
      {
        property: "og:description",
        content: "Draft polished professional emails in seconds with WorkFlow AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SmartEmailPage,
});

function SmartEmailPage() {
  const { setGenerating } = useGenerating();
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<EmailTone>("formal");
  const [audience, setAudience] = useState<EmailAudience>("client");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!context.trim()) return;
    setLoading(true);
    setGenerating(true);
    setResult(null);
    try {
      setResult(await generateEmail(context, tone, audience));
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl">
        <PageTitle
          icon={<Mail className="h-5 w-5" />}
          title="Smart Email Generator"
          subtitle="Describe what you need to say — get a ready-to-send draft."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Inputs" description="Tell the assistant what to write." />
            <div className="space-y-4 p-5">
              <div>
                <Label htmlFor="context">Email Context / Goal</Label>
                <TextArea
                  id="context"
                  rows={6}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Ask the client for a two-week extension on the design phase because of scope changes."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value as EmailTone)}
                  >
                    <option value="formal">Formal</option>
                    <option value="informal">Informal</option>
                    <option value="persuasive">Persuasive</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="audience">Audience</Label>
                  <Select
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as EmailAudience)}
                  >
                    <option value="client">Client</option>
                    <option value="manager">Manager</option>
                    <option value="team">Team</option>
                  </Select>
                </div>
              </div>
              <PrimaryButton
                onClick={handleGenerate}
                loading={loading}
                disabled={!context.trim()}
                className="w-full"
              >
                {loading ? "Generating email…" : "Generate Email"}
              </PrimaryButton>
            </div>
          </Card>

          <Card className="flex flex-col">
            <CardHeader
              title="Generated Email"
              description="Review before sending."
              action={
                result ? (
                  <button
                    onClick={handleCopy}
                    aria-label="Copy to clipboard"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                ) : undefined
              }
            />
            {loading && <SkeletonLines />}
            {!loading && !result && (
              <EmptyState>Your generated email will appear here.</EmptyState>
            )}
            {!loading && result && (
              <div className="space-y-4 p-5">
                <div className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground">
                  Subject: {result.subject}
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {result.body}
                </pre>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export function PageTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function SkeletonLines() {
  return (
    <div className="space-y-3 p-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-3.5 animate-pulse rounded bg-secondary"
          style={{ width: `${90 - i * 9}%` }}
        />
      ))}
    </div>
  );
}
