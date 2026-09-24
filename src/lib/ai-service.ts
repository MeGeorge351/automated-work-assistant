/**
 * WorkFlow AI — AI Service Layer
 * --------------------------------
 * All calls to the AI provider (OpenAI / Anthropic / Lovable AI Gateway)
 * live here. The three tools currently run in MOCK mode: each function
 * simulates network latency and returns a realistic placeholder result.
 *
 * TO GO LIVE:
 *  1. Add your API key as a server-side secret (never in browser code).
 *  2. Move the fetch call into a createServerFn handler or server route.
 *  3. Replace the mock bodies below with the real fetch requests,
 *     keeping the SYSTEM_PROMPTS below as the `system` message.
 */

// ---------------------------------------------------------------------------
// SYSTEM PROMPTS — edit these to refine the prompt engineering for each tool.
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPTS = {
  smartEmail: `You are an expert professional communication assistant.
Your job is to write clear, effective workplace emails.
Rules:
- Match the requested tone exactly (formal, informal, or persuasive).
- Adapt vocabulary and level of detail to the audience (client, manager, or team).
- Structure every email with: subject line, greeting, 2-3 short body paragraphs, and a sign-off.
- Never invent facts, figures, names, or commitments not present in the user's context.
- Keep the email under 200 words unless the context clearly requires more.`,

  meetingSummarizer: `You are an expert meeting analyst.
Given raw meeting notes or a transcript, produce a structured summary with exactly three sections:
1. "Executive Summary" — a short paragraph (3-5 sentences) capturing the purpose, key discussion points, and outcome.
2. "Action Items & Responsibilities" — a checklist; each item names the owner and the task.
3. "Deadlines" — every date or time commitment mentioned, highlighted.
Rules:
- Do not invent action items, owners, or dates that are not in the notes.
- If a section has no content in the source, say so explicitly.
- Be concise; use bullet points over prose.`,

  taskPlanner: `You are an expert productivity coach and weekly planning assistant.
Given a braindump of tasks, produce an optimized weekly plan:
1. Sort tasks into three buckets: "High Priority / Do Today", "Medium Priority / Schedule", and "Low Priority / Delegate".
2. Suggest a realistic day/time slot for each scheduled task.
3. Provide one "Time Optimization Tip" — a single, specific, actionable suggestion based on the task mix (e.g. batching, time-blocking, delegation).
Rules:
- Prioritize by impact and urgency, not by order in the list.
- Never schedule more than 3 high-priority items per day.
- Flag tasks that are too vague to schedule and suggest a clarifying next step.`,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmailTone = "formal" | "informal" | "persuasive";
export type EmailAudience = "client" | "manager" | "team";

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface MeetingSummary {
  executiveSummary: string;
  actionItems: { owner: string; task: string }[];
  deadlines: string[];
}

export interface TaskPlan {
  high: string[];
  medium: string[];
  low: string[];
  optimizationTip: string;
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const MOCK_LATENCY_MS = 2000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Feature 1 — Smart Email Generator
// ---------------------------------------------------------------------------

export async function generateEmail(
  context: string,
  tone: EmailTone,
  audience: EmailAudience,
): Promise<GeneratedEmail> {
  // LIVE MODE (future):
  //   const res = await fetch("https://api.openai.com/v1/chat/completions", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${API_KEY}` }, // inject key server-side
  //     body: JSON.stringify({
  //       model: "gpt-4o",
  //       messages: [
  //         { role: "system", content: SYSTEM_PROMPTS.smartEmail },
  //         { role: "user", content: `Context: ${context}\nTone: ${tone}\nAudience: ${audience}` },
  //       ],
  //     }),
  //   });
  await delay(MOCK_LATENCY_MS);

  const greetings: Record<EmailAudience, string> = {
    client: "Dear valued client,",
    manager: "Hi there,",
    team: "Hey team,",
  };
  const closings: Record<EmailTone, string> = {
    formal: "Kind regards,\n[Your Name]",
    informal: "Cheers,\n[Your Name]",
    persuasive: "Looking forward to your thoughts,\n[Your Name]",
  };
  const toneLine: Record<EmailTone, string> = {
    formal: "I am writing to formally address the following matter.",
    informal: "Just wanted to drop a quick note about this.",
    persuasive: "I believe this is a great opportunity, and here's why it matters.",
  };

  return {
    subject: `Re: ${context.slice(0, 60)}${context.length > 60 ? "…" : ""}`,
    body: `${greetings[audience]}

${toneLine[tone]}

${context}

Please let me know if you have any questions or need further details. I'm happy to discuss this at your earliest convenience.

${closings[tone]}`,
  };
}

// ---------------------------------------------------------------------------
// Feature 2 — Meeting Notes Summarizer
// ---------------------------------------------------------------------------

export async function summarizeMeeting(notes: string): Promise<MeetingSummary> {
  // LIVE MODE (future): same pattern as generateEmail, using
  // SYSTEM_PROMPTS.meetingSummarizer as the system message and `notes`
  // as the user message. Request JSON output matching the MeetingSummary type.
  await delay(MOCK_LATENCY_MS);

  const wordCount = notes.trim().split(/\s+/).filter(Boolean).length;

  return {
    executiveSummary: `The meeting covered ${wordCount} words of discussion across the team's current priorities. Participants aligned on the main objectives, reviewed progress against existing commitments, and agreed on a set of follow-up actions. Overall sentiment was positive, with clear ownership assigned for next steps.`,
    actionItems: [
      { owner: "Sarah", task: "Draft the updated project timeline and share it by end of week" },
      { owner: "James", task: "Follow up with the client on the outstanding feedback items" },
      { owner: "Priya", task: "Prepare the budget review deck for next Tuesday's sync" },
      { owner: "Whole team", task: "Review the shared notes and add any missing context" },
    ],
    deadlines: ["Friday, 5:00 PM — project timeline", "Next Tuesday — budget review sync", "End of month — client feedback due"],
  };
}

// ---------------------------------------------------------------------------
// Feature 3 — AI Task Planner / Scheduler
// ---------------------------------------------------------------------------

export async function planTasks(braindump: string): Promise<TaskPlan> {
  // LIVE MODE (future): same pattern, using SYSTEM_PROMPTS.taskPlanner.
  // Request JSON output matching the TaskPlan type.
  await delay(MOCK_LATENCY_MS);

  const tasks = braindump
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const high = tasks.slice(0, Math.min(3, tasks.length));
  const medium = tasks.slice(high.length, high.length + 3);
  const low = tasks.slice(high.length + medium.length);

  return {
    high: high.length ? high : ["Review and respond to urgent client emails"],
    medium: medium.length ? medium : ["Prepare weekly status update", "Book 1:1s with direct reports"],
    low: low.length ? low : ["Organize shared drive folders", "Update team wiki pages"],
    optimizationTip:
      "Batch all email and Slack responses into two 30-minute blocks (11:30 AM and 4:30 PM) instead of reacting throughout the day — this typically recovers 60–90 minutes of deep-focus time daily.",
  };
}
