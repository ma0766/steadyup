// HTTP API Lambda: POST /sets (TV records a finished set) and GET /summary (family page + TV "This week").
// Everything stored here is counts. There is no field that could hold body points or video.
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { z } from "zod";
import type { Store } from "./pairing";
import { addDays, isDay, summarize } from "./summary";
import { dynamoStore } from "./store-dynamo";
import { bedrockGenerate, DEFAULT_TARGETS, makePlan, PLAN_COOLDOWN_MS } from "./plan";

const HOME = /^[a-f0-9]{32}$/;
export const SetBody = z.object({
  home: z.string().regex(HOME),
  session: z.string().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/),
  idx: z.number().int().min(0).max(99),
  move: z.enum(["chair_stand_30", "sit_to_stand", "heel_raise", "side_leg_raise", "march", "tandem_hold"]),
  side: z.enum(["left", "right"]).optional(),
  target: z.number().int().min(1).max(60),
  done: z.number().int().min(0).max(60),
  cues: z.number().int().min(0).max(100),
  day: z.string().refine(isDay),
  ts: z.number().int().positive(),
}).strict(); // unknown fields (like a stray "landmarks") are rejected, not stored

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" };
const reply = (statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 => ({ statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) });

export async function route(
  method: string, path: string, query: Record<string, string | undefined>, body: string | undefined, store: Store,
  nowMs = Date.now(), generate: (prompt: string) => Promise<string> = bedrockGenerate,
) {
  if (method === "POST" && path === "/sets") {
    let parsed: unknown;
    try { parsed = JSON.parse(body ?? ""); } catch { return reply(400, { error: "That did not look right." }); }
    const r = SetBody.safeParse(parsed);
    if (!r.success) return reply(400, { error: "That did not look right." });
    const { home, ...rec } = r.data;
    await store.putSet(home, rec);
    return reply(200, { saved: true });
  }
  if (method === "GET" && path === "/summary") {
    const home = query.home ?? "";
    if (!HOME.test(home)) return reply(400, { error: "That link did not work." });
    const today = query.today && isDay(query.today) ? query.today : new Date(nowMs).toISOString().slice(0, 10);
    const sets = await store.listSets(home, addDays(today, -40), addDays(today, 2));
    return reply(200, summarize(sets, today));
  }
  if (path === "/plan" || path === "/plan/refresh") {
    const home = query.home ?? "";
    if (!HOME.test(home)) return reply(400, { error: "That link did not work." });
    const stored = await store.getPlan(home);
    if (method === "GET" && path === "/plan") return reply(200, stored ?? { targets: DEFAULT_TARGETS, changes: [], source: "default", updatedAt: 0 });
    if (method === "POST" && path === "/plan/refresh") {
      // at most one change per week (the caps are weekly) and one paid model call per week per home
      if (stored && stored.source === "model" && nowMs - stored.updatedAt < PLAN_COOLDOWN_MS) return reply(200, stored);
      const today = new Date(nowMs).toISOString().slice(0, 10);
      const sets = await store.listSets(home, addDays(today, -7), addDays(today, 2));
      const plan = await makePlan(sets, stored?.targets ?? DEFAULT_TARGETS, generate, nowMs);
      if (plan.source === "model") await store.putPlan(home, plan); // a failed call changes nothing
      return reply(200, plan);
    }
  }
  return reply(404, { error: "Not found." });
}

let store: Store | undefined;
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  store ??= dynamoStore(process.env.TABLE ?? "steadyup");
  try {
    return await route(event.requestContext.http.method, event.rawPath, event.queryStringParameters ?? {}, event.body, store);
  } catch {
    return reply(500, { error: "Please try again in a moment." });
  }
};
