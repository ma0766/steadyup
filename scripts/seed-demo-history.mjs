// Seeds sample history for the demo so the family page can say "4 sessions this week, up from 2" after today's live session.
// Usage: node scripts/seed-demo-history.mjs [homeId]   (default: read the id from the debug app on the running emulator)
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const { apiUrl, webUrl } = JSON.parse(fs.readFileSync("config/endpoints.json", "utf8"));
const ADB = "/mnt/c/Users/angep/AppData/Local/Android/Sdk/platform-tools/adb.exe";
let home = process.argv[2];
if (!home) {
  const xml = execFileSync(ADB, ["shell", "run-as", "com.steadyup.tv", "cat", "shared_prefs/steadyup.xml"], { encoding: "utf8" });
  home = /name="home_id">([a-f0-9]{32})</.exec(xml)?.[1];
  if (!home) throw new Error("No home id yet: open the app once (and finish the pairing screen), or pass the id as an argument.");
}
const day = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const plan = [["sit_to_stand", 8], ["heel_raise", 10], ["march", 12]];
let n = 0;
for (const ago of [2, 4, 6, 8, 10]) { // three sessions this week, two the week before
  for (const [i, [move, target]] of plan.entries()) {
    const r = await fetch(`${apiUrl}/sets`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ home, session: `demo${ago}`, idx: i, move, target, done: target, cues: 0, day: day(ago), ts: Date.now() - ago * 86_400_000 + i }) });
    if (!r.ok) throw new Error(`seed failed: ${r.status}`);
    n++;
  }
}
console.log(`seeded ${n} sets for home ${home}`);
console.log(`family link: ${webUrl}/family.html?h=${home}`);
