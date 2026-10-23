// HTTP API Lambda: POST /sets (TV records a finished set) and GET /summary (family page + TV "This week").
// Everything stored here is counts. There is no field that could hold body points or video.
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { z } from "zod";
import type { Store } from "./pairing";
import { addDays, isDay, summarize } from "./summary";
import { dynamoStore } from "./store-dynamo";

const HOME = /^[a-f0-9]{32}$/;
export const SetBody = z.object({
  home: z.string().regex(HOME),
  session: z.string().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/),
  idx: z.number().int().min(0).max(99),
  move: z.enum(["sit_to_stand", "heel_raise", "side_leg_raise", "march", "tandem_hold"]),
  side: z.enum(["left", "right"]).optional(),
  target: z.number().int().min(1).max(60),
  done: z.number().int().min(0).max(60),
  cues: z.number().int().min(0).max(100),
  day: z.string().refine(isDay),
  ts: z.number().int().positive(),
}).strict(); // unknown fields (like a stray "landmarks") are rejected, not stored

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" };
const reply = (statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 => ({ statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) });

export async function route(method: string, path: string, query: Record<string, string | undefined>, body: string | undefined, store: Store, nowMs = Date.now()) {
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
