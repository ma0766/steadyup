import { describe, it, expect } from "vitest";
import fs from "node:fs";

// Every word a person can read on the TV lives in these Kotlin files. Scan the string literals for tech words and long sentences.
const BANNED = ["landmark", "websocket", "sync", " api", "error code", "server", "pose "];
const read = (f: string) => fs.readFileSync(`android/app/src/main/java/com/steadyup/tv/${f}`, "utf8");

function literals(src: string): string[] {
  return [...src.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)].map((m) => m[1]).filter((s) => /[A-Za-z]{3}/.test(s));
}
const sentencesObject = (() => { const p = read("Protocol.kt"); return p.slice(p.indexOf("object Sentences"), p.indexOf("val ALL")); })();
const files: Record<string, string> = {
  "Screens.kt": read("Screens.kt"), "Cdc.kt": read("Cdc.kt"), "Plan.kt": read("Plan.kt"), "Sentences (Protocol.kt)": sentencesObject,
};

describe("S9 plain words on every TV screen", () => {
  for (const [name, src] of Object.entries(files)) {
    it(`${name}: no tech words and every sentence under 12 words`, () => {
      const lits = literals(src);
      expect(lits.length).toBeGreaterThan(0);
      for (const l of lits) {
        const lower = ` ${l.toLowerCase()} `;
        for (const w of BANNED) expect(lower.includes(w), `"${w}" in "${l}"`).toBe(false);
        for (const sentence of l.split(/[.?!]\s*/).filter(Boolean)) {
          if (/\$|\{|%/.test(sentence)) continue; // templates are checked by the Kotlin tests with real values
          expect(sentence.trim().split(/\s+/).length, `too long: "${sentence}"`).toBeLessThan(12);
        }
      }
    });
  }
  it("all text on the TV is at least 40 sp", () => {
    const sizes = [...read("Screens.kt").matchAll(/fontSize\s*=\s*(\d+)\.sp/g)].map((m) => +m[1]);
    expect(sizes.length).toBeGreaterThan(20);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(40);
    const cue = [...read("Screens.kt").matchAll(/else (\d+)(?:\)|\.sp)/g)].map((m) => +m[1]);
    for (const n of cue) expect(n).toBeGreaterThanOrEqual(40);
    const fontSp = [...read("Screens.kt").matchAll(/fontSp\s*=\s*(\d+)/g)].map((m) => +m[1]);
    for (const n of fontSp) expect(n).toBeGreaterThanOrEqual(40);
  });
});
