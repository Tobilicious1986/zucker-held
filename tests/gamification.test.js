import { describe, expect, it, vi } from "vitest";
import {
  calculateXp,
  getCurrentLevel,
  getProgressPercent,
} from "../frontend/src/lib/gamification.ts";

describe("gamification helpers", () => {
  it("berechnet XP aus Streak, heutigen Eintraegen und Gesamtmenge", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T12:00:00Z"));

    const entries = [
      { type: "BZ", timestamp: new Date("2026-04-13T08:00:00Z").getTime() },
      { type: "MEAL", timestamp: new Date("2026-04-13T10:00:00Z").getTime() },
      { type: "INSULIN", timestamp: new Date("2026-04-12T10:00:00Z").getTime() },
      { type: "BZ", timestamp: new Date("2026-04-11T10:00:00Z").getTime() },
      { type: "MEAL", timestamp: new Date("2026-04-10T10:00:00Z").getTime() },
      { type: "BZ", timestamp: new Date("2026-04-09T10:00:00Z").getTime() },
      { type: "MEAL", timestamp: new Date("2026-04-08T10:00:00Z").getTime() },
      { type: "BZ", timestamp: new Date("2026-04-07T10:00:00Z").getTime() },
      { type: "MEAL", timestamp: new Date("2026-04-06T10:00:00Z").getTime() },
      { type: "BZ", timestamp: new Date("2026-04-05T10:00:00Z").getTime() },
    ];

    expect(calculateXp(entries, 4)).toBe(51);
    vi.useRealTimers();
  });

  it("ordnet das passende Level und das naechste Ziel zu", () => {
    const { level, nextLevel } = getCurrentLevel(365);

    expect(level.name).toBe("Zielbereich-Ritter");
    expect(nextLevel?.name).toBe("Streak-Stürmer");
  });

  it("liefert 100 Prozent beim Max-Level", () => {
    expect(getProgressPercent(1200)).toBe(100);
  });
});
