import { describe, it, expect } from "vitest";
import { compareLine, lastLines, sessionsLine, streakLine, type Summary } from "./summaryText";

const base: Summary = { today: "2026-10-22", weekSessions: 4, prevWeekSessions: 2, streak: 3, days: [], last: { day: "2026-10-22", totals: [
  { label: "Sit to stand", done: 8, unit: "reps" }, { label: "Foot in front", done: 20, unit: "seconds" }] } };

describe("S6 family page words", () => {
  it("says sessions this week, up from last week", () => {
    expect(sessionsLine(base)).toBe("4 sessions this week");
    expect(compareLine(base)).toBe("Up from 2.");
  });
  it("handles one session, same, down and none", () => {
    expect(sessionsLine({ ...base, weekSessions: 1 })).toBe("1 session this week");
    expect(compareLine({ ...base, weekSessions: 2 })).toBe("Same as last week.");
    expect(compareLine({ ...base, weekSessions: 1 })).toBe("Down from 2.");
    expect(compareLine({ ...base, weekSessions: 0, prevWeekSessions: 0 })).toBe("A new week to begin.");
  });
  it("streak and last session lines are plain", () => {
    expect(streakLine(base)).toBe("3 days in a row");
    expect(streakLine({ ...base, streak: 1 })).toBe("1 day in a row");
    expect(streakLine({ ...base, streak: 0 })).toBe("A good day to start again.");
    expect(lastLines(base)).toEqual(["Sit to stand: 8", "Foot in front: 20 seconds"]);
    expect(lastLines({ ...base, last: null })).toEqual(["Nothing yet."]);
  });
  it("uses no tech words", () => {
    const text = [sessionsLine(base), compareLine(base), streakLine(base), ...lastLines(base)].join(" ").toLowerCase();
    for (const w of ["api", "sync", "landmark", "websocket", "server", "error"]) expect(text).not.toContain(w);
  });
});
