// Family page: weekly summary by invite link (?h=<home id>). Refreshes itself so a finished session shows up quickly.
import { compareLine, lastLines, sessionsLine, shortDay, streakLine, type Summary } from "./summaryText";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const home = new URLSearchParams(location.search).get("h") ?? "";

function problem(text: string) { const p = $("problem"); p.textContent = text; p.classList.remove("hidden"); }

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function render(s: Summary) {
  $("problem").classList.add("hidden");
  $("content").classList.remove("hidden");
  $("sessions").textContent = sessionsLine(s);
  $("compare").textContent = compareLine(s);
  $("streak").textContent = streakLine(s);
  const max = Math.max(1, ...s.days.map((d) => d.reps));
  $("bars").innerHTML = s.days.map((d) =>
    `<div class="bar"><i class="${d.sessions ? "on" : ""}" style="height:${Math.round((d.reps / max) * 72)}px"></i>${shortDay(d.day)}</div>`).join("");
  $("last").innerHTML = lastLines(s).map((l) => `<li>${l.replace(/[<>&]/g, "")}</li>`).join("");
}

async function load(apiUrl: string) {
  try {
    const r = await fetch(`${apiUrl}/summary?home=${encodeURIComponent(home)}&today=${localToday()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    render(await r.json());
  } catch {
    problem("We can't load this week yet. Please try again.");
  }
}

(async () => {
  if (!/^[a-f0-9]{32}$/.test(home)) return problem("This link did not work. Ask for a new one.");
  try {
    const { apiUrl } = await (await fetch("./config.json", { cache: "no-store" })).json();
    await load(apiUrl);
    setInterval(() => void load(apiUrl), 5000);
  } catch { problem("We can't load this week yet. Please try again."); }
})();
export {};
