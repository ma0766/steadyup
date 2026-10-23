// Fixture recorder page: saves a landmark stream (not video) as JSON for engine tests.
import { createPoseDetector } from "./pose";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const video = $<HTMLVideoElement>("preview");
const info = $("info");
const link = $<HTMLAnchorElement>("download");
type Rec = { t: number; lm: { x: number; y: number; visibility: number }[] | null };
let frames: Rec[] = [];
let recording = false;

$("rec").addEventListener("click", async () => {
  $<HTMLButtonElement>("rec").disabled = true; // one recording at a time
  frames = []; link.removeAttribute("href"); link.classList.add("hidden");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
  video.srcObject = stream; await video.play();
  const detect = await createPoseDetector();
  recording = true; $<HTMLButtonElement>("stop").disabled = false;
  const t0 = performance.now();
  let lastTime = -1;
  const loop = () => {
    if (!recording) { stream.getTracks().forEach((t) => t.stop()); return; }
    if (video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      const now = performance.now();
      const lm = detect(video, now);
      frames.push({ t: Math.round(now - t0), lm: lm ? lm.map((l) => ({ x: +l.x.toFixed(4), y: +l.y.toFixed(4), visibility: +l.visibility.toFixed(3) })) : null });
      info.textContent = `Recording… ${frames.length} frames`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});

$("stop").addEventListener("click", () => {
  recording = false;
  const blob = new Blob([JSON.stringify({ fps: 30, frames })], { type: "application/json" });
  link.href = URL.createObjectURL(blob);
  link.classList.remove("hidden");
  $<HTMLButtonElement>("rec").disabled = false;
  info.textContent = `Saved ${frames.length} frames.`;
});
export {};
