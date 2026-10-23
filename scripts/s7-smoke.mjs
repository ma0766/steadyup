// Live Bedrock smoke: one real plan call through the deployed API. Exit 0 = valid plan, 2 = blocked (no Bedrock access), 1 = broken.
import { randomBytes } from "node:crypto";
import fs from "node:fs";
const { apiUrl } = JSON.parse(fs.readFileSync("config/endpoints.json", "utf8"));
const home = randomBytes(16).toString("hex");
const day = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
for (let i = 0; i < 7; i++) {
  const r = await fetch(`${apiUrl}/sets`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ home, session: `smoke${i}`, idx: 0, move: "sit_to_stand", target: 8, done: 8, cues: 0, day: day(i), ts: Date.now() - i * 86400000 }) });
  if (!r.ok) { console.error("could not seed", r.status); process.exit(1); }
}
const r = await fetch(`${apiUrl}/plan/refresh?home=${home}`, { method: "POST" });
const plan = await r.json();
console.log(JSON.stringify(plan, null, 1).slice(0, 1200));
if (plan.source === "kept") { console.log("BLOCKED: model call failed, plan kept (check Bedrock access)"); process.exit(2); }
const ok = plan.source === "model" && Object.entries(plan.targets).every(([k, v]) => {
  const cur = { sit_to_stand: 8, heel_raise: 10, "side_leg_raise@left": 8, "side_leg_raise@right": 8, march: 12, tandem_hold: 20 }[k];
  const step = k === "tandem_hold" ? 5 : 2, max = k === "tandem_hold" ? 30 : 15;
  return Math.abs(v - cur) <= step && v <= max;
}) && plan.changes.length === 6 && plan.changes.every((c) => typeof c.sentence === "string" && c.sentence.length > 0);
console.log(ok ? "PASS: live plan is valid and within caps" : "FAIL: invalid plan");
process.exit(ok ? 0 : 1);
