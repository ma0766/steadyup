// Phone page: join by link (?code=) or by typing the number.
import { joinTv, loadConfig } from "./pair";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const codeInput = $<HTMLInputElement>("code");
const statusLine = $("status");
const say = (text: string, cls = "") => { statusLine.textContent = text; statusLine.className = cls; };

async function join(code: string) {
  say("Connecting…");
  try {
    const { wsUrl } = await loadConfig();
    joinTv(wsUrl, code, (e) => {
      if (e.kind === "connected") { $("join").classList.add("hidden"); say("Connected", "ok"); }
      else if (e.kind === "problem") say(e.message, "bad");
    });
  } catch {
    say("We could not start. Please try again.", "bad");
  }
}

$("joinBtn").addEventListener("click", () => join(codeInput.value.replace(/\D/g, "")));
const fromLink = new URLSearchParams(location.search).get("code");
if (fromLink) { codeInput.value = fromLink; join(fromLink); }
