// A scripted phone for TV flow tests: a Node WebSocket client that pairs like the phone page does, then plays a set
// when the TV asks for one. Every set plays SYNTHETIC landmark frames through the real engine for that move,
// faster than real time. Video is never involved.
import WebSocket from "ws";
import { createEngine } from "../web/src/engine/engine";
import { createCalibrator } from "../web/src/engine/calibration";
import { heelRaiseFrames, marchFrames, sideLegRaiseFrames, sitToStandFrames, tandemFrames } from "../web/src/engine/fixtures";
import type { MoveId } from "../web/src/engine/types";
import type { Frame } from "../web/src/engine/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ScriptedPhone {
  private ws!: WebSocket;
  private runId = 0;
  private lastSeq: number | undefined;
  autoRun = true;
  calibrationUnclearTimes = 0; // how many times to pretend the two slow stands were unclear (the TV retries)
  private calRuns = 0;
  frameMs = 12; // pacing per 33 ms fixture frame: about 2.7x faster than real time
  kneesCaveFirstSet = true;
  private sets = 0;
  moves: string[] = [];

  constructor(private wsUrl: string) {}

  /** Pair with the TV by number, or (with `hello`) join a Move together room as family. */
  join(code: string, hello: object = { type: "join", code }): Promise<void> {
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("pairing timed out")), 20_000);
      this.ws.on("open", () => this.send(hello));
      this.ws.on("error", reject);
      this.ws.on("message", (raw) => {
        const m = JSON.parse(raw.toString());
        if (m.type === "paired" || m.type === "room-joined") { clearTimeout(t); resolve(); }
        else if (m.type === "error") { clearTimeout(t); reject(new Error(m.message)); }
        else if (m.type === "calibrate") void this.calibrate();
        else if (m.type === "move") { if (m.seq !== undefined && m.seq === this.lastSeq) return; this.lastSeq = m.seq; console.log(`[phone] move ${m.move} ${m.side ?? ""} target ${m.target}`); this.moves.push(m.move); if (this.autoRun) void this.playSet(m.move, m.target, m.side ?? null); }
        else if (m.type === "state" && m.state === "set-end") this.runId++; // stop the current set
      });
    });
  }

  joinRoom(code: string, name: string) { return this.join(code, { type: "room-join", code, name }); }

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

  /** Two slow stands through the real calibrator, then report like the phone page does. */
  private async calibrate() {
    const id = ++this.runId;
    const run = this.calRuns++;
    const cal = createCalibrator();
    const frames = run < this.calibrationUnclearTimes
      ? sitToStandFrames({ reps: 1, moveMs: 2200, holdMs: 900, noise: 0.003 })     // one stand only: unclear
      : sitToStandFrames({ reps: 2, moveMs: 2200, holdMs: 900, noise: 0.003 });
    let reported = -1;
    for (let i = 0; i < frames.length && id === this.runId; i++) {
      if (i % 3 === 0) this.sendPose(frames[i]);
      cal.push(frames[i]);
      const c = cal.progress();
      if (c !== reported) { reported = c; this.send({ type: "cal", state: "progress", cycles: c }); }
      await sleep(this.frameMs);
    }
    if (id !== this.runId) return;
    const r = cal.result();
    this.send({ type: "cal", state: r.status, cycles: r.cycles });
  }

  private framesFor(move: string, side: string | null, target: number, cave: boolean): Frame[] {
    const noise = 0.003;
    switch (move) {
      case "chair_stand_30": return sitToStandFrames({ reps: 12, noise });
      case "sit_to_stand": return sitToStandFrames({ reps: target, cave: cave ? 0.2 : 0, noise });
      case "heel_raise": return heelRaiseFrames({ reps: target, noise });
      case "side_leg_raise": return sideLegRaiseFrames({ reps: target, side: side === "right" ? "right" : "left", noise });
      case "march": return marchFrames({ lifts: target, noise });
      case "tandem_hold": return tandemFrames({ seconds: target, noise });
      default: throw new Error(`no fixture for ${move}`);
    }
  }

  private async playSet(move: string, target: number, side: string | null) {
    const id = ++this.runId;
    const first = this.sets++ === 0;
    const frames = this.framesFor(move, side, Math.max(target, 1), first && this.kneesCaveFirstSet && move === "sit_to_stand");
    const engine = createEngine(move as MoveId, { side: side === "right" ? "right" : "left" });
    let lastCount = 0, lastSent = 0;
    for (let i = 0; i < frames.length && id === this.runId; i++) {
      if (i % 3 === 0) this.sendPose(frames[i]);
      for (const e of engine.push(frames[i])) {
        if (e.type === "rep") { lastCount = e.count; this.send({ type: "rep", move, count: e.count }); }
        else if (e.type === "hold") { lastCount = e.seconds; this.send({ type: "rep", move, count: e.seconds }); }
        else if (e.type === "cue") this.send({ type: "cue", text: e.text });
      }
      if (lastCount > 0 && i % 80 === 0) this.send({ type: "rep", move, count: lastCount }); // same heal-by-resend as the phone page
      await sleep(this.frameMs);
    }
    // the last count is re-sent until the TV ends the set (it sends set-end), like the phone page does
    while (id === this.runId && lastCount > 0 && lastSent++ < 6) { this.send({ type: "rep", move, count: lastCount }); await sleep(500); }
    console.log(`[phone] set ${move} ended: aborted=${id !== this.runId} lastCount=${lastCount}/${target}`);
  }
}
