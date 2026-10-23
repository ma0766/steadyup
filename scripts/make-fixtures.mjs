// Downloads the freely licensed exercise video and converts it to y4m 640x480 for Chromium's fake camera.
// Files are gitignored (y4m is uncompressed, ~100 MB). License: docs/FIXTURES.md.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
fs.mkdirSync("fixtures", { recursive: true });
const webm = "fixtures/squat.webm", y4m = "fixtures/squat.y4m";
if (!fs.existsSync(y4m)) {
  if (!fs.existsSync(webm)) {
    const r = await fetch("https://upload.wikimedia.org/wikipedia/commons/5/5c/Squat_-_exercise_demonstration_video.webm",
      { headers: { "User-Agent": "steadyup-hackathon/0.1 (ap@stareofowlstechnology.com)" } });
    if (!r.ok) throw new Error(`fixture download failed: ${r.status}`);
    fs.writeFileSync(webm, Buffer.from(await r.arrayBuffer()));
  }
  execFileSync(ffmpeg, ["-v", "error", "-i", webm, "-vf", "fps=30,scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2",
    "-pix_fmt", "yuv420p", "-y", y4m]);
}
console.log("fixtures ready:", y4m);
