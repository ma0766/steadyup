import { describe, it, expect } from "vitest";
import fs from "node:fs";

const manifest = fs.readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
const pngSize = (f: string) => { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

describe("S9 Fire TV readiness (manifest and assets)", () => {
  it("has the leanback launcher intent", () => {
    expect(manifest).toContain("android.intent.category.LEANBACK_LAUNCHER");
    expect(manifest).toContain("android.intent.action.MAIN");
  });
  it("does not require a touchscreen, and does not require leanback so it also installs on phones for testing", () => {
    expect(manifest).toMatch(/android.hardware.touchscreen"\s+android:required="false"/);
  });
  it("has a 320x180 banner wired into the app and the activity", () => {
    expect(pngSize("android/app/src/main/res/drawable-xhdpi/banner.png")).toEqual({ w: 320, h: 180 });
    expect(manifest.match(/android:banner="@drawable\/banner"/g)?.length).toBe(2);
  });
  it("has an app icon", () => {
    expect(pngSize("android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png")).toEqual({ w: 192, h: 192 });
    expect(manifest).toContain('android:icon="@mipmap/ic_launcher"');
  });
  it("asks only for the internet", () => {
    expect([...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)].map((m) => m[1])).toEqual(["android.permission.INTERNET"]);
  });
  it("lists no Google Play services or Firebase in the build file", () => {
    const gradle = fs.readFileSync("android/app/build.gradle.kts", "utf8").toLowerCase();
    for (const w of ["play-services", "firebase", "com.google.android.gms", "mlkit", "gms"]) expect(gradle.includes(w), w).toBe(false);
  });
});
