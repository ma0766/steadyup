// AI weekly plan. The model only SUGGESTS next targets; code decides. Never runs in the live loop (called after a session or on demand).
import { z } from "zod";
import { moveLabel, type SetRec } from "./summary";

export type Targets = Record<string, number>; // key = move, or move@side
export type Change = { key: string; label: string; from: number; to: number; sentence: string };
export type Plan = { targets: Targets; changes: Change[]; source: "model" | "kept" | "default"; updatedAt: number };

export const DEFAULT_TARGETS: Targets = {
  sit_to_stand: 8, heel_raise: 10, "side_leg_raise@left": 8, "side_leg_raise@right": 8, march: 12, tandem_hold: 20,
};
export const LIMITS = { maxReps: 15, maxHold: 30, minReps: 4, minHold: 10, stepReps: 2, stepHold: 5 };

const isHold = (key: string) => key.startsWith("tandem_hold");
const keyLabel = (key: string) => { const [m, s] = key.split("@"); return moveLabel(m, s); };

/** Hard limits, enforced in code after the model: at most +-2 reps (+-5 s) per week, never above 15 reps / 30 s. */
export function capTarget(key: string, current: number, proposed: number): number {
  const hold = isHold(key);
  const step = hold ? LIMITS.stepHold : LIMITS.stepReps;
  const max = hold ? LIMITS.maxHold : LIMITS.maxReps, min = hold ? LIMITS.minHold : LIMITS.minReps;
  const p = Number.isFinite(proposed) ? Math.round(proposed) : current;
  const stepped = Math.min(current + step, Math.max(current - step, p));
  return Math.min(max, Math.max(Math.min(min, current), stepped)); // a floor, but never raise someone who is already below it
}

export const ModelOutput = z.object({
  moves: z.array(z.object({ key: z.string(), next: z.number(), sentence: z.string().optional() })).max(20),
});

const BANNED = ["landmark", "websocket", "sync", " api", "server", "error", "pose ", "model", "algorithm", " ai "];
export const PLAN_COOLDOWN_MS = 7 * 86_400_000; // one change per week: the caps are per week, so refreshes inside a week return the stored plan
const MEDICAL = ["fall", "prevent", "doctor", "medical", "cure", "diagnos", "treat", "injur"];
export const isPlain = (s: string) =>
  s.split(/[.?!]\s*/).filter(Boolean).every((x) => x.trim().split(/\s+/).length < 12) &&
  !BANNED.some((b) => ` ${s.toLowerCase()} `.includes(b)) && !MEDICAL.some((m) => s.toLowerCase().includes(m)) && s.length <= 140;

/** A model sentence must agree with the number the code actually chose (the code may have capped it). */
export const agreesWith = (s: string, from: number, to: number) => (s.match(/\d+/g) ?? []).every((n) => Number(n) === to || Number(n) === from);

export function fallbackSentence(key: string, from: number, to: number): string {
  const unit = isHold(key) ? " seconds" : "";
  if (to > from) return `Let's try ${to}${unit}.`;
  if (to < from) return `Let's ease back to ${to}${unit}.`;
  return `Let's keep it at ${to}${unit}.`;
}

export function buildPrompt(sets: SetRec[], current: Targets): string {
  const rows = sets.map((s) => ({ day: s.day, move: s.move + (s.side ? `@${s.side}` : ""), target: s.target, done: s.done, cues: s.cues }));
  return [
    "You help older adults build balance and strength safely with chair-supported exercises.",
    "Below are the last 7 days of sets (counts only) and the current targets per move.",
    "Suggest next week's target for each move. Small steps only. If cues were frequent, hold or lower the target.",
    `Moves: ${Object.keys(current).join(", ")}. Reps for all moves except tandem_hold, which is seconds.`,
    "Reply with JSON only, no other text, in this shape:",
    '{"moves":[{"key":"sit_to_stand","next":10,"sentence":"You did 8 every day. Let\'s try 10."}]}',
    "Each sentence: plain words, under 12 words, kind, no medical claims.",
    `Current targets: ${JSON.stringify(current)}`,
    `Last 7 days: ${JSON.stringify(rows)}`,
  ].join("\n");
}

function extractJson(text: string): unknown {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("no json");
  return JSON.parse(text.slice(a, b + 1));
}

/** Ask the model, validate, cap. ANY failure keeps the current plan. */
export async function makePlan(
  sets: SetRec[], current: Targets, generate: (prompt: string) => Promise<string>, now = Date.now(),
): Promise<Plan> {
  const kept: Plan = { targets: { ...current }, changes: [], source: "kept", updatedAt: now };
  let out: z.infer<typeof ModelOutput>;
  try { out = ModelOutput.parse(extractJson(await generate(buildPrompt(sets, current)))); } catch { return kept; }

  const targets: Targets = { ...current };
  const changes: Change[] = [];
  for (const key of Object.keys(current)) {
    const m = out.moves.find((x) => x.key === key);
    const to = capTarget(key, current[key], m ? m.next : current[key]);
    targets[key] = to;
    const sentence = m?.sentence && isPlain(m.sentence) && agreesWith(m.sentence, current[key], to) ? m.sentence.trim() : fallbackSentence(key, current[key], to);
    changes.push({ key, label: keyLabel(key), from: current[key], to, sentence });
  }
  return { targets, changes, source: "model", updatedAt: now };
}

/** Real model call: Bedrock Claude Haiku via the US inference profile (the plain model id is not available on demand). */
export async function bedrockGenerate(prompt: string): Promise<string> {
  const { BedrockRuntimeClient, ConverseCommand } = await import("@aws-sdk/client-bedrock-runtime");
  const client = new BedrockRuntimeClient({ region: "us-east-1" });
  const r = await client.send(new ConverseCommand({
    modelId: process.env.MODEL_ID ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0",
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 700, temperature: 0.2 },
  }));
  return r.output?.message?.content?.map((c) => ("text" in c ? c.text : "")).join("") ?? "";
}
