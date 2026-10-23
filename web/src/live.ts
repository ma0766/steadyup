// Live loop on the phone: camera -> pose -> throttled send (20/s). Also measures round-trip time via TV acks.
import { createPoseDetector, packLandmarks } from "./pose";

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
): Promise<{ stop: () => void; onAck: (t: number) => void }> {
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
    stop: () => { running = false; stream.getTracks().forEach((t) => t.stop()); },
    // TV echoes our timestamp; clocks differ so we use round trip / 2 (one-way estimate).
    onAck: (t) => { tele.latenciesMs.push((Date.now() - t) / 2); },
  };
}
