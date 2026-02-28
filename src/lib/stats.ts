export type GoalType = "for" | "against";

export type GoalEvent = {
  goal_type: GoalType;
  player: string;
  position: "LW" | "C" | "RW";
  goal_date: string;
};

export type PlayerStat = {
  player: string;
  position: "LW" | "C" | "RW";
  plus_minus: number;
  goals_for: number;
  goals_against: number;
};

export type LineCombo = {
  lw: PlayerStat;
  c: PlayerStat;
  rw: PlayerStat;
  plus_minus: number;
  score: number;
};

export const parseCsv = (contents: string): GoalEvent[] => {
  const [headerLine, ...rows] = contents.trim().split("\n");
  const headers = headerLine.split(",");

  return rows
    .map((row) => row.split(","))
    .filter((columns) => columns.length === headers.length)
    .map((columns) => {
      const record = Object.fromEntries(
        headers.map((header, index) => [header, columns[index]])
      ) as Record<string, string>;

      return {
        goal_type: record.goal_type as GoalType,
        player: record.player,
        position: record.position as PlayerStat["position"],
        goal_date: record.goal_date,
      };
    });
};

export const scoreLine = (plusMinus: number) => plusMinus;

export const buildPlayerStats = (goals: GoalEvent[]): PlayerStat[] => {
  const stats = new Map<string, PlayerStat>();

  goals.forEach((goal) => {
    const current = stats.get(goal.player);
    const goalsFor = goal.goal_type === "for" ? 1 : 0;
    const goalsAgainst = goal.goal_type === "against" ? 1 : 0;

    if (!current) {
      stats.set(goal.player, {
        player: goal.player,
        position: goal.position,
        plus_minus: goalsFor - goalsAgainst,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
      });
      return;
    }

    stats.set(goal.player, {
      ...current,
      plus_minus: current.plus_minus + goalsFor - goalsAgainst,
      goals_for: current.goals_for + goalsFor,
      goals_against: current.goals_against + goalsAgainst,
    });
  });

  return Array.from(stats.values()).sort((a, b) =>
    a.player.localeCompare(b.player)
  );
};

export const buildLineCombos = (players: PlayerStat[]): LineCombo[] => {
  const lws = players.filter((player) => player.position === "LW");
  const centers = players.filter((player) => player.position === "C");
  const rws = players.filter((player) => player.position === "RW");
  const combos: LineCombo[] = [];

  lws.forEach((lw) => {
    centers.forEach((c) => {
      rws.forEach((rw) => {
        const plusMinus = lw.plus_minus + c.plus_minus + rw.plus_minus;

        combos.push({
          lw,
          c,
          rw,
          plus_minus: plusMinus,
          score: scoreLine(plusMinus),
        });
      });
    });
  });

  return combos.sort((a, b) => b.score - a.score);
};
