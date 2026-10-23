// Plain-language lines for the family page. Pure so tests can check them.
export type Summary = {
  today: string; weekSessions: number; prevWeekSessions: number; streak: number;
  days: { day: string; sessions: number; reps: number }[];
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
