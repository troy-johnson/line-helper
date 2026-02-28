import { describe, it, expect } from "vitest";
import {
  parseCsv,
  scoreLine,
  buildPlayerStats,
  buildLineCombos,
} from "./stats";
import type { GoalEvent, PlayerStat } from "./stats";

// ---------------------------------------------------------------------------
// parseCsv
// ---------------------------------------------------------------------------

describe("parseCsv", () => {
  it("parses well-formed CSV into GoalEvent[]", () => {
    const csv = [
      "goal_type,player,position,goal_date",
      "for,Alex Mercer,LW,2024-11-02",
      "against,Jordan Pike,C,2024-11-02",
    ].join("\n");

    expect(parseCsv(csv)).toEqual([
      { goal_type: "for", player: "Alex Mercer", position: "LW", goal_date: "2024-11-02" },
      { goal_type: "against", player: "Jordan Pike", position: "C", goal_date: "2024-11-02" },
    ]);
  });

  it("ignores rows with wrong column count", () => {
    const csv = [
      "goal_type,player,position,goal_date",
      "for,Alex Mercer,LW,2024-11-02",
      "bad-row",
    ].join("\n");

    expect(parseCsv(csv)).toHaveLength(1);
  });

  it("returns empty array for header-only CSV", () => {
    const csv = "goal_type,player,position,goal_date";
    expect(parseCsv(csv)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// scoreLine
// ---------------------------------------------------------------------------

describe("scoreLine", () => {
  it("returns the plus/minus value unchanged", () => {
    expect(scoreLine(5)).toBe(5);
    expect(scoreLine(-3)).toBe(-3);
    expect(scoreLine(0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildPlayerStats
// ---------------------------------------------------------------------------

describe("buildPlayerStats", () => {
  it("counts goals for and against, computes plus/minus", () => {
    const goals: GoalEvent[] = [
      { goal_type: "for", player: "Alex Mercer", position: "LW", goal_date: "2024-11-02" },
      { goal_type: "for", player: "Alex Mercer", position: "LW", goal_date: "2024-11-02" },
      { goal_type: "against", player: "Alex Mercer", position: "LW", goal_date: "2024-11-02" },
    ];

    const [alex] = buildPlayerStats(goals);
    expect(alex.goals_for).toBe(2);
    expect(alex.goals_against).toBe(1);
    expect(alex.plus_minus).toBe(1);
  });

  it("handles multiple players independently", () => {
    const goals: GoalEvent[] = [
      { goal_type: "for", player: "Alex Mercer", position: "LW", goal_date: "2024-11-02" },
      { goal_type: "against", player: "Jordan Pike", position: "C", goal_date: "2024-11-02" },
    ];

    const stats = buildPlayerStats(goals);
    const alex = stats.find((p) => p.player === "Alex Mercer")!;
    const jordan = stats.find((p) => p.player === "Jordan Pike")!;

    expect(alex.plus_minus).toBe(1);
    expect(jordan.plus_minus).toBe(-1);
  });

  it("returns players sorted alphabetically by name", () => {
    const goals: GoalEvent[] = [
      { goal_type: "for", player: "Sam Keller", position: "RW", goal_date: "2024-11-02" },
      { goal_type: "for", player: "Alex Mercer", position: "LW", goal_date: "2024-11-02" },
    ];

    const stats = buildPlayerStats(goals);
    expect(stats[0].player).toBe("Alex Mercer");
    expect(stats[1].player).toBe("Sam Keller");
  });

  it("returns empty array for no goals", () => {
    expect(buildPlayerStats([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildLineCombos
// ---------------------------------------------------------------------------

const makeStat = (
  player: string,
  position: PlayerStat["position"],
  plus_minus: number
): PlayerStat => ({
  player,
  position,
  plus_minus,
  goals_for: 0,
  goals_against: 0,
});

describe("buildLineCombos", () => {
  it("produces cartesian product of LW × C × RW", () => {
    const players: PlayerStat[] = [
      makeStat("LW1", "LW", 0),
      makeStat("LW2", "LW", 0),
      makeStat("C1", "C", 0),
      makeStat("RW1", "RW", 0),
    ];

    expect(buildLineCombos(players)).toHaveLength(2); // 2 LW × 1 C × 1 RW
  });

  it("sums plus/minus across the line", () => {
    const players: PlayerStat[] = [
      makeStat("LW1", "LW", 3),
      makeStat("C1", "C", -1),
      makeStat("RW1", "RW", 2),
    ];

    const [combo] = buildLineCombos(players);
    expect(combo.plus_minus).toBe(4);
  });

  it("sorts combos descending by score", () => {
    const players: PlayerStat[] = [
      makeStat("LW1", "LW", -2),
      makeStat("LW2", "LW", 5),
      makeStat("C1", "C", 0),
      makeStat("RW1", "RW", 0),
    ];

    const combos = buildLineCombos(players);
    expect(combos[0].lw.player).toBe("LW2");
    expect(combos[combos.length - 1].lw.player).toBe("LW1");
  });

  it("returns empty array when a position has no players", () => {
    const players: PlayerStat[] = [
      makeStat("LW1", "LW", 0),
      makeStat("C1", "C", 0),
      // no RW
    ];

    expect(buildLineCombos(players)).toEqual([]);
  });
});
