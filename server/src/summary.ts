// Weekly summary from stored sets. Pure: sets in, plain numbers out. Counts only, never body points.
export type SetRec = {
  session: string; idx: number; move: string; side?: string; target: number; done: number; cues: number; day: string; ts: number;
};
export type Summary = {
  today: string;
  weekSessions: number;
  prevWeekSessions: number;
  streak: number;
  days: { day: string; sessions: number; reps: number }[]; // last 7 days, oldest first
  chair: { day: string; score: number }[]; // CDC 30-second chair stand scores, oldest first (last 8)
  last: { day: string; totals: { label: string; done: number; unit: "reps" | "seconds" }[] } | null;
};

const TITLES: Record<string, string> = {
  chair_stand_30: "Chair stand check", sit_to_stand: "Sit to stand", heel_raise: "Heel raises", side_leg_raise: "Leg out to the side", march: "March in place", tandem_hold: "Foot in front",
};
export const moveLabel = (move: string, side?: string) => (TITLES[move] ?? move) + (side ? `, ${side}` : "");

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = (s: string) => DAY.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
export const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

export function summarize(allSets: SetRec[], todayParam: string): Summary {
  // the chair stand check is a measurement, not a workout: it has its own trend and stays out of sessions, streaks and totals
  const chairSets = allSets.filter((s) => s.move === "chair_stand_30").sort((a, b) => a.ts - b.ts);
  const sets = allSets.filter((s) => s.move !== "chair_stand_30");
  const chair = chairSets.slice(-8).map((s) => ({ day: s.day, score: s.done }));
  // Phone and TV can sit in different time zones: never treat a recorded day as "in the future".
  const latest = allSets.reduce((m, s) => (s.day > m ? s.day : m), "");
  const today = latest > todayParam ? latest : todayParam;

  const sessionsOn = (from: string, to: string) => new Set(sets.filter((s) => s.day >= from && s.day <= to).map((s) => s.session));
  const weekSessions = sessionsOn(addDays(today, -6), today).size;
  const prevWeekSessions = sessionsOn(addDays(today, -13), addDays(today, -7)).size;

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    const ofDay = sets.filter((s) => s.day === day);
    return { day, sessions: new Set(ofDay.map((s) => s.session)).size, reps: ofDay.reduce((n, s) => n + s.done, 0) };
  });

  // streak: consecutive days with a session, ending today (or yesterday, if today has none yet)
  const active = new Set(sets.map((s) => s.day));
  let cursor = active.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (active.has(cursor)) { streak++; cursor = addDays(cursor, -1); }

  let last: Summary["last"] = null;
  if (sets.length) {
    const newest = sets.reduce((a, b) => (b.ts > a.ts ? b : a));
    const inSession = sets.filter((s) => s.session === newest.session).sort((a, b) => a.idx - b.idx);
    const totals = new Map<string, { label: string; done: number; unit: "reps" | "seconds" }>();
    for (const s of inSession) {
      const label = moveLabel(s.move, s.side);
      const t = totals.get(label) ?? { label, done: 0, unit: s.move === "tandem_hold" ? "seconds" as const : "reps" as const };
      t.done += s.done; totals.set(label, t);
    }
    last = { day: newest.day, totals: [...totals.values()] };
  }
  return { today, weekSessions, prevWeekSessions, streak, days, chair, last };
}
