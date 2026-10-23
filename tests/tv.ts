// Helpers to drive the Android TV emulator from Playwright tests (Windows adb, read the code via logcat).
import { execFileSync } from "node:child_process";
import fs from "node:fs";

export const ADB = "/mnt/c/Users/angep/AppData/Local/Android/Sdk/platform-tools/adb.exe";
export const adb = (...a: string[]) => execFileSync(ADB, a, { encoding: "utf8", maxBuffer: 50_000_000 }).replace(/\r/g, "");
export const logcat = (tag: string) => adb("logcat", "-d", "-s", tag);
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fresh TV app launch; returns the newest pairing number it logged (the app may refresh it once). */
export async function tvCode(): Promise<string> {
  adb("logcat", "-c");
  adb("shell", "pm", "clear", "com.steadyup.tv");
  adb("shell", "am", "start", "-n", "com.steadyup.tv/.MainActivity");
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
