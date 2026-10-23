// Phone page: join by link (?code=) or by typing the number, then start the camera.
import { joinTv, loadConfig, type Link } from "./pair";
import { startLive } from "./live";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const codeInput = $<HTMLInputElement>("code");
const statusLine = $("status");
const say = (text: string, cls = "") => { statusLine.textContent = text; statusLine.className = cls; };

let link: Link | undefined;
let live: Awaited<ReturnType<typeof startLive>> | undefined;

async function beginCamera() {
  try {
    live = await startLive($("preview") as HTMLVideoElement, (o) => { link?.send(o); if ((o as any).type === "rep") $("count").textContent = String((o as any).count); }, (seen) => {
      $("seen").textContent = seen ? "I can see you." : "Step back so I can see your whole body.";
    });
    $("live").classList.remove("hidden");
  } catch {
    $("live").classList.remove("hidden"); // keep the page usable: one friendly sentence, status stays "Connected"
    $("seen").textContent = "We can't use the camera. Please allow it and try again.";
  }
}

async function join(code: string) {
  say("Connecting…");
  try {
    const { wsUrl } = await loadConfig();
    link = joinTv(wsUrl, code, (e) => {
      if (e.kind === "connected") { $("join").classList.add("hidden"); say("Connected", "ok"); void beginCamera(); }
      else if (e.kind === "problem") say(e.message, "bad");
      else if (e.kind === "message" && e.data.type === "ack") live?.onAck(e.data.t);
      else if (e.kind === "message" && e.data.type === "move") { $("count").textContent = "0"; const bad = live?.setMove(e.data.move, e.data.side); if (bad) $("seen").textContent = bad; }
      else if (e.kind === "message" && e.data.type === "state" && e.data.state === "set-end") live?.endSet();
    });
  } catch {
    say("We could not start. Please try again.", "bad");
  }
}

$("joinBtn").addEventListener("click", () => join(codeInput.value.replace(/\D/g, "")));
const fromLink = new URLSearchParams(location.search).get("code");
if (fromLink) { codeInput.value = fromLink; join(fromLink); }
