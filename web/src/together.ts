// Family page for "Move together": join the host TV's room by number, use your own camera, count your own reps.
import { joinRoom, loadConfig, type Link } from "./pair";
import { startLive } from "./live";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const statusLine = $("status");
const say = (text: string, cls = "") => { statusLine.textContent = text; statusLine.className = cls; };
let link: Link | undefined;
let live: Awaited<ReturnType<typeof startLive>> | undefined;
let lastSeq: number | undefined;

async function beginCamera() {
  try {
    live = await startLive($("preview") as HTMLVideoElement, (o) => { link?.send(o); if ((o as any).type === "rep") $("count").textContent = String((o as any).count); }, (seen) => {
      $("seen").textContent = seen ? "I can see you." : "Step back so I can see your whole body.";
    });
  } catch {
    $("seen").textContent = "We can't use the camera. Please allow it and try again.";
  }
  $("live").classList.remove("hidden");
}

async function join(code: string, name: string) {
  say("Connecting…");
  try {
    const { wsUrl } = await loadConfig();
    link = joinRoom(wsUrl, code, name, (e) => {
      if (e.kind === "connected") { $("join").classList.add("hidden"); say("You joined.", "ok"); void beginCamera(); }
      else if (e.kind === "problem") say(e.message, "bad");
      else if (e.kind === "message" && e.data.type === "move") {
        if (e.data.seq !== undefined && e.data.seq === lastSeq) return;
        lastSeq = e.data.seq; $("count").textContent = "0";
        const bad = live?.setMove(e.data.move, e.data.side); if (bad) $("seen").textContent = bad;
      } else if (e.kind === "message" && e.data.type === "state" && e.data.state === "set-end") live?.endSet();
    });
  } catch { say("We could not start. Please try again.", "bad"); }
}

$("joinBtn").addEventListener("click", () => join(($("code") as HTMLInputElement).value.replace(/\D/g, ""), ($("name") as HTMLInputElement).value.trim()));
const q = new URLSearchParams(location.search);
if (q.get("room")) ($("code") as HTMLInputElement).value = q.get("room")!;
if (q.get("name")) ($("name") as HTMLInputElement).value = q.get("name")!;
if (q.get("room") && q.get("name")) join(q.get("room")!, q.get("name")!);
export {};
