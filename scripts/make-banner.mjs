// Renders the Fire TV launcher banner (320x180) and app icon (192x192) from HTML with Playwright's Chromium.
import { chromium } from "@playwright/test";
import fs from "node:fs";
const figure = `<svg viewBox="0 0 100 160" width="SIZE" height="SIZE" fill="none" stroke="#7bdc8f" stroke-width="6" stroke-linecap="round"><circle cx="50" cy="20" r="13"/><path d="M50 36v52M50 48l-26 24M50 48l26 24M50 88l-20 52M50 88l20 52"/></svg>`;
const banner = `<body style="margin:0;width:320px;height:180px;background:#101820;display:flex;align-items:center;justify-content:center;gap:18px;font-family:system-ui,sans-serif;color:#fff">
  ${figure.replaceAll("SIZE", "110")}<div><div style="font-size:44px;font-weight:800;line-height:1">SteadyUp</div><div style="font-size:17px;color:#bfd7ea;margin-top:8px">Your balance coach</div></div></body>`;
const icon = `<body style="margin:0;width:192px;height:192px;background:#101820;display:flex;align-items:center;justify-content:center">${figure.replaceAll("SIZE", "130")}</body>`;
const b = await chromium.launch();
for (const [html, w, h, out] of [[banner, 320, 180, "android/app/src/main/res/drawable-xhdpi/banner.png"], [icon, 192, 192, "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  fs.writeFileSync(out, await p.screenshot({ clip: { x: 0, y: 0, width: w, height: h } }));
  console.log("wrote", out);
}
await b.close();
