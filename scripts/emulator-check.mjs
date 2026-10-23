// Emulator checks: install APK, launch, screenshot. Usage: node scripts/emulator-check.mjs s0
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
const ADB = "/mnt/c/Users/angep/AppData/Local/Android/Sdk/platform-tools/adb.exe";
const name = process.argv[2] ?? "s0";
const devs = spawnSync(ADB, ["devices"], { encoding: "utf8" }).stdout ?? "";
if (!/\bdevice\b/.test(devs.split("\n").slice(1).join("\n"))) { console.log("emulator not running"); process.exit(2); }
execFileSync("bash", ["scripts/apk.sh"], { stdio: "inherit" });
await new Promise((r) => setTimeout(r, 4000));
const png = execFileSync(ADB, ["exec-out", "screencap", "-p"], { maxBuffer: 50_000_000 });
fs.mkdirSync("docs/screens", { recursive: true });
fs.writeFileSync(`docs/screens/${name}-tv.png`, png);
console.log(`saved docs/screens/${name}-tv.png (${png.length} bytes)`);
