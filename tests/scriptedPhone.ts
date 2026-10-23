// A scripted phone for TV flow tests: a Node WebSocket client that pairs like the phone page does, then plays a set
// when the TV asks for one. Sit-to-stand sets run SYNTHETIC landmark frames through the real engine; other moves send
// scripted reps until their engines exist (S5). Video is never involved.
import WebSocket from "ws";
import { createEngine } from "../web/src/engine/engine";
import { sitToStandFrames } from "../web/src/engine/fixtures";
import type { Frame } from "../web/src/engine/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ScriptedPhone {
  private ws!: WebSocket;
  private runId = 0;
  autoRun = true;
  kneesCaveFirstSet = true;
  private sets = 0;
  moves: string[] = [];

  constructor(private wsUrl: string) {}

  join(code: string): Promise<void> {
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("pairing timed out")), 20_000);
      this.ws.on("open", () => this.send({ type: "join", code }));
      this.ws.on("error", reject);
      this.ws.on("message", (raw) => {
        const m = JSON.parse(raw.toString());
        if (m.type === "paired") { clearTimeout(t); resolve(); }
        else if (m.type === "error") { clearTimeout(t); reject(new Error(m.message)); }
        else if (m.type === "move") { this.moves.push(m.move); if (this.autoRun) void this.playSet(m.move, m.target); }
        else if (m.type === "state" && m.state === "set-end") this.runId++; // stop the current set
      });
    });
  }

  send(o: unknown) { if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(o)); }
  outOfView() { this.send({ type: "state", state: "out-of-view" }); }
  inView() { this.send({ type: "state", state: "in-view" }); }
  close() { this.runId++; this.ws?.close(); }

  private sendPose(f: Frame) {
    if (!f.lm) return;
    const p: number[] = [];
    for (const l of f.lm) p.push(+l.x.toFixed(3), +l.y.toFixed(3), +l.visibility.toFixed(2));
    this.send({ type: "pose", t: Date.now(), p });
  }

  private async playSet(move: string, target: number) {
    const id = ++this.runId;
    const first = this.sets++ === 0;
    const frames = sitToStandFrames({ reps: Math.max(target, 1), cave: first && this.kneesCaveFirstSet && move === "sit_to_stand" ? 0.2 : 0, noise: 0.003 });
    if (move === "sit_to_stand") {
      const engine = createEngine("sit_to_stand");
      for (let i = 0; i < frames.length && id === this.runId; i++) {
        if (i % 3 === 0) this.sendPose(frames[i]);
        for (const e of engine.push(frames[i])) {
          if (e.type === "rep") this.send({ type: "rep", move, count: e.count });
          else if (e.type === "cue") this.send({ type: "cue", text: e.text });
        }
        await sleep(12);
      }
    } else {
      // scripted reps (engine for this move arrives in S5); figure still moves
      for (let n = 1; n <= target && id === this.runId; n++) {
        for (let k = 0; k < 8 && id === this.runId; k++) { this.sendPose(frames[(n * 8 + k) % frames.length]); await sleep(50); }
        this.send({ type: "rep", move, count: n });
      }
    }
  }
}
