// Live loop on the phone: camera -> pose -> throttled send (20/s). Also measures round-trip time via TV acks.
import { createPoseDetector, packLandmarks } from "./pose";
import { createEngine, type MoveEngine } from "./engine/engine";
import type { EngineEvent, MoveId } from "./engine/types";

export const SEND_INTERVAL_MS = 50; // 20 messages/s to the TV

export type Telemetry = { latenciesMs: number[]; sent: number; detected: number };
declare global { interface Window { __steadyup?: Telemetry } }

export function medianOf(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function startLive(
  video: HTMLVideoElement,
  send: (o: unknown) => void,
  onTick: (seen: boolean) => void,
): Promise<{ stop: () => void; onAck: (t: number) => void; setMove: (move: string, side?: string | null) => string | null; endSet: () => void }> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
  video.srcObject = stream;
  let detect: Awaited<ReturnType<typeof createPoseDetector>>;
  try {
    await video.play();
    detect = await createPoseDetector();
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop()); // do not leave the camera on if the pose model failed to load
    throw e;
  }
  const tele: Telemetry = (window.__steadyup = { latenciesMs: [], sent: 0, detected: 0 });
  // The TV picks the move ("move" message); counting lives here on the phone. Nothing counts until a set starts.
  let engine: MoveEngine | null = null;
  let moveLabel = ""; // kept for debugging in the console
  const forward = (events: EngineEvent[]) => {
    for (const e of events) {
      if (e.type === "rep") send({ type: "rep", move: e.move, count: e.count });
      else if (e.type === "cue") send({ type: "cue", text: e.text });
      else if (e.type === "low-confidence") send({ type: "state", state: "out-of-view" });
      else if (e.type === "back-in-view") send({ type: "state", state: "in-view" });
    }
  };
  let last = 0, running = true, lastVideoTime = -1;

  const frame = () => {
    if (!running) return;
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const now = performance.now();
      if (now - last >= SEND_INTERVAL_MS) {
        let lm: ReturnType<typeof detect> = null;
        try { lm = detect(video, now); } catch { /* one bad frame must not stop the loop */ }
        onTick(!!lm);
        if (engine) forward(engine.push({ t: now, lm }));
        if (lm) {
          last = now;
          tele.detected++;
          send({ type: "pose", t: Date.now(), p: packLandmarks(lm) });
          tele.sent++;
        }
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  return {
    // returns an error sentence if this move cannot be counted
    setMove: (move, _side) => {
      try { engine = createEngine(move as MoveId); moveLabel = move; return null; }
      catch { engine = null; return "I can't count that one yet."; }
    },
    endSet: () => { engine?.reset(); engine = null; },
    stop: () => { running = false; stream.getTracks().forEach((t) => t.stop()); },
    // TV echoes our timestamp; clocks differ so we use round trip / 2 (one-way estimate).
    onAck: (t) => { tele.latenciesMs.push((Date.now() - t) / 2); },
  };
}
