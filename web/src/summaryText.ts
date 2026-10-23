// Plain-language lines for the family page. Pure so tests can check them.
export type Summary = {
  today: string; weekSessions: number; prevWeekSessions: number; streak: number;
  days: { day: string; sessions: number; reps: number }[];
  chair?: { day: string; score: number }[];
  last: { day: string; totals: { label: string; done: number; unit: "reps" | "seconds" }[] } | null;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function sessionsLine(s: Summary): string {
  return `${plural(s.weekSessions, "session", "sessions")} this week`;
}
export function compareLine(s: Summary): string {
  if (s.weekSessions > s.prevWeekSessions) return `Up from ${s.prevWeekSessions}.`;
  if (s.weekSessions < s.prevWeekSessions) return `Down from ${s.prevWeekSessions}.`;
  return s.weekSessions === 0 ? "A new week to begin." : "Same as last week.";
}
export function streakLine(s: Summary): string {
  return s.streak === 0 ? "A good day to start again." : `${plural(s.streak, "day", "days")} in a row`;
}
export function lastLines(s: Summary): string[] {
  if (!s.last) return ["Nothing yet."];
  return s.last.totals.map((t) => `${t.label}: ${t.done}${t.unit === "seconds" ? " seconds" : ""}`);
}
export function shortDay(day: string): string {
  return new Date(day + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });
}

/** CDC 30-second chair stand: how many full stands in 30 seconds. Shown as a trend, never as a verdict. */
export function chairNowLine(s: Summary): string {
  const last = s.chair?.at(-1);
  return last ? `${plural(last.score, "stand", "stands")} in 30 seconds` : "";
}
export function chairCompareLine(s: Summary): string {
  const c = s.chair ?? [];
  if (c.length < 2) return "First check saved.";
  const [prev, now] = [c.at(-2)!.score, c.at(-1)!.score];
  return now > prev ? `Up from ${prev} last time.` : now < prev ? `Down from ${prev} last time.` : `Same as last time (${prev}).`;
}
