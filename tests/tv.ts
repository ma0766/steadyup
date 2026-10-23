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
  adb("logcat", "-c");
  adb("shell", "pm", "clear", "com.steadyup.tv");
  adb("shell", "am", "start", "-n", "com.steadyup.tv/.MainActivity", ...extras);
  for (let i = 0; i < 40; i++) {
    if (/code=\d{6}/.test(logcat("SteadyUpPair"))) {
      await sleep(3000);
      return [...logcat("SteadyUpPair").matchAll(/code=(\d{6})/g)].pop()![1];
    }
    await sleep(1000);
  }
  throw new Error("TV never showed a number");
}

export function tvScreenshotBuffer(): Buffer {
  return execFileSync(ADB, ["exec-out", "screencap", "-p"], { maxBuffer: 50_000_000 });
}
export function tvScreenshot(name: string): Buffer {
  fs.mkdirSync("docs/screens", { recursive: true });
  const png = tvScreenshotBuffer();
  fs.writeFileSync(`docs/screens/${name}.png`, png);
  return png;
}

/** Remote control OK button. */
export const pressOk = () => adb("shell", "input", "keyevent", "KEYCODE_DPAD_CENTER");

/** Wait until the TV app logs that it is showing this screen (tag SteadyUpFlow). */
export async function waitScreen(name: string, timeoutMs = 60_000): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (logcat("SteadyUpFlow").includes(`shown=${name}`)) { await sleep(700); return; } // let the frame draw
    await sleep(300);
  }
  throw new Error(`TV never showed ${name}. Log:\n${logcat("SteadyUpFlow")}`);
}
