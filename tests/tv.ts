// Helpers to drive the Android TV emulator from Playwright tests (Windows adb, read the code via logcat).
import { execFileSync } from "node:child_process";
import fs from "node:fs";

export const ADB = "/mnt/c/Users/angep/AppData/Local/Android/Sdk/platform-tools/adb.exe";
// adb.exe through WSL occasionally fails a call; retry once before giving up.
export const adb = (...a: string[]): string => {
  for (let attempt = 0; ; attempt++) {
    try { return execFileSync(ADB, a, { encoding: "utf8", maxBuffer: 50_000_000 }).replace(/\r/g, ""); }
    catch (e) { if (attempt >= 2) throw e; execFileSync("sleep", ["1"]); }
  }
};
export const logcat = (tag: string) => adb("logcat", "-d", "-s", tag);
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fresh TV app launch; returns the newest pairing number it logged (the app may refresh it once). */
export async function tvCode(extras: string[] = []): Promise<string> {
  // scripted tests have no body to learn from, so skip the two slow stands unless a test asks for them
  if (!extras.includes("calibrate")) extras = [...extras, "--ez", "calibrate", "false"];
  adb("logcat", "-c");
  adb("shell", "pm", "clear", "com.steadyup.tv");
  adb("shell", "am", "start", "-n", "com.steadyup.tv/.MainActivity", ...extras);
  // the first launch after a fresh install is slow (the system optimises the app), so allow up to 2 minutes
  for (let i = 0; i < 120; i++) {
    if (/code=\d{6}/.test(logcat("SteadyUpPair"))) {
      await sleep(3000);
      return [...logcat("SteadyUpPair").matchAll(/code=(\d{6})/g)].pop()![1];
    }
    await sleep(1000);
  }
  throw new Error("TV never showed a number");
}

export function tvScreenshotBuffer(): Buffer {
  // adb.exe through WSL sometimes fails a screencap with a socket error: retry before giving up
  for (let attempt = 0; ; attempt++) {
    try { return execFileSync(ADB, ["exec-out", "screencap", "-p"], { maxBuffer: 50_000_000 }); }
    catch (e) { if (attempt >= 3) throw e; execFileSync("sleep", ["1"]); }
  }
}
export function tvScreenshot(name: string): Buffer {
  fs.mkdirSync("docs/screens", { recursive: true });
  const png = tvScreenshotBuffer();
  fs.writeFileSync(`docs/screens/${name}.png`, png);
  return png;
}

/** Remote control OK button. */
export const pressOk = () => adb("shell", "input", "keyevent", "KEYCODE_DPAD_CENTER");

/** Bounds of whatever has D-pad focus right now (UI hierarchy dump). Empty = nothing is focused. */
export function tvFocused(): string[] {
  adb("shell", "uiautomator", "dump", "/sdcard/ui.xml");
  const xml = adb("exec-out", "cat", "/sdcard/ui.xml");
  return [...xml.matchAll(/<node [^>]*focused="true"[^>]*bounds="(\[[^"]+)"/g)].map((m) => m[1]).filter((b) => !b.startsWith("[0,0][1920,1080]"));
}
/**
 * Measured text size: every text node's height from the UI tree. At 320 dpi one line of 40 sp text (80 px) is 93 px tall
 * (line height is 1.167 x the font size: a 48 sp line measures 112 px). Under 92 px means text smaller than the 40 sp floor.
 * Returns the problems and the smallest text seen, so the run can record real numbers per screen.
 */
export const MIN_LINE_PX = 92;
export function tvTextSizes(): { small: string[]; min?: { px: number; text: string } } {
  adb("shell", "uiautomator", "dump", "/sdcard/ui.xml");
  const xml = adb("exec-out", "cat", "/sdcard/ui.xml");
  const small: string[] = [];
  let min: { px: number; text: string } | undefined;
  for (const m of xml.matchAll(/<node [^>]*?text="([^"]+)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)) {
    const h = +m[5] - +m[3];
    if (!m[1].trim()) continue;
    if (!min || h < min.px) min = { px: h, text: m[1] };
    if (h < MIN_LINE_PX) small.push(`"${m[1]}" is ${h} px tall`);
  }
  return { small, min };
}
/** Real measurements per screen, written by the e2e run: docs/text-sizes.json (screen -> smallest text line, in px). */
function recordTextSize(screen: string, min?: { px: number; text: string }) {
  if (!min) return;
  const f = "docs/text-sizes.json";
  const all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  const key = screen.replace(/:\d+$/, ""); // intro:3 and intro:0 are the same screen
  if (!all[key] || min.px < all[key].smallestLinePx) all[key] = { smallestLinePx: min.px, text: min.text, fontSpAtLeast: +(min.px / 1.167 / 2).toFixed(1) };
  fs.writeFileSync(f, JSON.stringify(Object.fromEntries(Object.entries(all).sort()), null, 2) + "\n");
}
// Screens with something to press: a focus ring must be on one of them, or the remote's OK press does nothing visible.
const NEEDS_FOCUS = /^(safety|home|week|together|calibrate|chair-ask|chair-no|chair-about|chair-how|chair-result|paused|finish|intro:\d+|rest:\d+)$/;

/** Wait until the TV app logs that it is showing this screen (tag SteadyUpFlow). Screens with buttons must also show focus. */
export async function waitScreen(name: string, timeoutMs = 60_000, shot?: string): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (logcat("SteadyUpFlow").includes(`shown=${name}`)) {
      await sleep(shot ? 400 : 700); // let the frame draw
      if (shot) tvScreenshot(shot); // photograph first: the focus and text-size checks below take a couple of seconds
      const { small, min } = tvTextSizes();
      recordTextSize(name, min);
      if (small.length) throw new Error(`text under the 40 sp floor on screen "${name}": ${small.join('; ')}`);
      if (NEEDS_FOCUS.test(name)) {
        let ok = false;
        for (let i = 0; i < 6 && !ok; i++) { ok = tvFocused().length > 0; if (!ok) await sleep(500); }
        if (!ok) throw new Error(`no D-pad focus is visible on screen "${name}"`);
      }
      return;
    }
    await sleep(300);
  }
  throw new Error(`TV never showed ${name}. Log:\n${logcat("SteadyUpFlow")}`);
}

/** Press a remote key by Android name, e.g. KEYCODE_DPAD_DOWN. */
export const pressKey = (name: string) => adb("shell", "input", "keyevent", name);
