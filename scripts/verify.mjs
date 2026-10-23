// npm run verify — typecheck, unit, e2e, gradle, emulator; prints PASS/FAIL per slice.
// Convention: test files/classes start with the slice id (s3-*.test.ts, S4*Test.kt, "S5 ..." in e2e titles).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SLICES = ["S0 Walking skeleton","S1 Pairing","S2 Live mirror","S3 Rep engine: sit to stand","S4 Session flow on TV",
  "S5 All five moves","S6 History and family page","S7 AI weekly plan","S8 Move together"];
const results = []; // {slice, name, ok}
const steps = [];
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", encoding: "utf8", ...opts });
const sliceOf = (s) => { const m = /(?:^|[\/\\ ])[sS](\d)/.exec(s); return m ? +m[1] : null; };
const step = (name, ok, note = "") => { steps.push({ name, ok, note }); };

fs.mkdirSync("test-results", { recursive: true });

// 0 fixtures (fake-camera video), downloaded once
sh("node", ["scripts/make-fixtures.mjs"]);

// 1 typecheck (our lint)
step("typecheck", sh("npm", ["run", "typecheck", "--silent"]).status === 0);

// 2 unit (vitest)
sh("npx", ["vitest", "run", "--reporter=default", "--reporter=json", "--outputFile.json=test-results/vitest.json"]);
if (fs.existsSync("test-results/vitest.json")) {
  const j = JSON.parse(fs.readFileSync("test-results/vitest.json", "utf8"));
  for (const f of j.testResults) for (const t of f.assertionResults)
    results.push({ slice: sliceOf(path.basename(f.name)), name: t.fullName, ok: t.status === "passed" });
}
step("unit tests", results.length > 0 && results.every((r) => r.ok));

// 3 e2e (playwright)
fs.rmSync("test-results/pw.json", { force: true });
sh("npx", ["playwright", "test"]);
if (fs.existsSync("test-results/pw.json")) {
  const j = JSON.parse(fs.readFileSync("test-results/pw.json", "utf8"));
  const walk = (s) => { for (const sp of s.specs ?? []) for (const t of sp.tests) results.push({ slice: sliceOf(sp.title) ?? sliceOf(path.basename(s.file ?? "")), name: sp.title, ok: t.status === "expected" });
    for (const c of s.suites ?? []) walk(c); };
  for (const s of j.suites) walk({ ...s, file: s.file });
}
step("e2e", fs.existsSync("test-results/pw.json") && JSON.parse(fs.readFileSync("test-results/pw.json", "utf8")).stats.unexpected === 0);

// 4 gradle unit tests (TV logic)
const g = sh("bash", ["-c", "source scripts/env.sh && cd android && ./gradlew --no-daemon -q testDebugUnitTest"]);
const gdir = "android/app/build/test-results/testDebugUnitTest";
if (fs.existsSync(gdir)) for (const f of fs.readdirSync(gdir).filter((x) => x.endsWith(".xml"))) {
  const x = fs.readFileSync(path.join(gdir, f), "utf8");
  for (const m of x.matchAll(/<testcase name="([^"]+)" classname="([^"]+)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g))
    results.push({ slice: sliceOf(m[2].split(".").pop()), name: `${m[2]}.${m[1]}`, ok: !/<failure|<error/.test(m[4] ?? "") });
}
step("gradle test", g.status === 0);

// 5 emulator (blocked is reported loudly but does not fail verify, per CLAUDE.md)
const e = sh("node", ["scripts/emulator-check.mjs", "verify"]);
const emuNote = e.status === 2 ? "BLOCKED: emulator not running" : "";
step("emulator", e.status === 0 || e.status === 2, emuNote);
if (e.status === 0) results.push({ slice: 0, name: "emulator install+launch+screenshot", ok: true });
if (e.status !== 0 && e.status !== 2) results.push({ slice: 0, name: "emulator install+launch+screenshot", ok: false });

console.log("\n=== verify: steps ===");
for (const s of steps) console.log(`${s.ok ? "PASS" : "FAIL"}  ${s.name} ${s.note}`);
console.log("\n=== verify: slices ===");
let anyFail = steps.some((s) => !s.ok);
SLICES.forEach((label, i) => {
  const rs = results.filter((r) => r.slice === i);
  const bad = rs.filter((r) => !r.ok).length;
  const status = rs.length === 0 ? "not built" : bad ? `FAIL (${bad}/${rs.length} failing)` : `PASS (${rs.length} checks)`;
  if (bad) anyFail = true;
  console.log(`${label.padEnd(34)} ${status}`);
});
process.exit(anyFail ? 1 : 0);
