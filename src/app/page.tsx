import fs from "fs";
import path from "path";

const attendingPlayers = [
  "Alex Mercer",
  "Jordan Pike",
  "Sam Keller",
  "Taylor Reed",
  "Chris Nolan",
  "Mason Cole"
];

type GoalType = "for" | "against";

type GoalEvent = {
  goal_type: GoalType;
  player: string;
  position: "LW" | "C" | "RW";
  goal_date: string;
};

type PlayerStat = {
  player: string;
  position: "LW" | "C" | "RW";
  plus_minus: number;
  goals_for: number;
  goals_against: number;
};

type LineCombo = {
  lw: PlayerStat;
  c: PlayerStat;
  rw: PlayerStat;
  plus_minus: number;
  score: number;
};

const parseCsv = (contents: string): GoalEvent[] => {
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
        goal_date: record.goal_date
      };
    });
};

const scoreLine = (plusMinus: number) => plusMinus;

const loadGoalData = (): GoalEvent[] => {
  const filePath = path.join(process.cwd(), "data", "players.csv");
  const contents = fs.readFileSync(filePath, "utf8");
  return parseCsv(contents);
};

const buildPlayerStats = (goals: GoalEvent[]): PlayerStat[] => {
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
        goals_against: goalsAgainst
      });
      return;
    }

    stats.set(goal.player, {
      ...current,
      plus_minus: current.plus_minus + goalsFor - goalsAgainst,
      goals_for: current.goals_for + goalsFor,
      goals_against: current.goals_against + goalsAgainst
    });
  });

  return Array.from(stats.values()).sort((a, b) =>
    a.player.localeCompare(b.player)
  );
};

const buildLineCombos = (players: PlayerStat[]): LineCombo[] => {
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
          score: scoreLine(plusMinus)
        });
      });
    });
  });

  return combos.sort((a, b) => b.score - a.score);
};

export default function Home() {
  const goals = loadGoalData();
  const playerStats = buildPlayerStats(goals);
  const attendingRoster = playerStats.filter((player) =>
    attendingPlayers.includes(player.player)
  );
  const combos = buildLineCombos(attendingRoster);
  const topCombo = combos[0];

  return (
    <main>
      <section className="section">
        <h1>Line Helper</h1>
        <p>
          Track every goal event per skater. Each entry logs whether the goal was
          for or against, the player on ice, and the date. The app converts that
          into plus/minus totals to suggest LW-C-RW combinations.
        </p>
        <div className="tag-list">
          {attendingPlayers.map((player) => (
            <span key={player} className="tag">
              {player}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Player impact snapshot</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Pos</th>
              <th>Goals For</th>
              <th>Goals Against</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {attendingRoster.map((player) => (
              <tr key={player.player}>
                <td>{player.player}</td>
                <td>{player.position}</td>
                <td>{player.goals_for}</td>
                <td>{player.goals_against}</td>
                <td>{player.plus_minus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footer-note">
          Add more goal events over time to keep the plus/minus totals current.
        </p>
      </section>

      <section className="section">
        <h2>Best projected line</h2>
        {topCombo ? (
          <div className="card">
            <h3>
              {topCombo.lw.player} · {topCombo.c.player} · {topCombo.rw.player}
            </h3>
            <p className="highlight">
              Projected score: <span className="score-pill">{topCombo.score.toFixed(1)}</span>
            </p>
            <div className="grid">
              <div>
                <p>+/-</p>
                <p className="highlight">{topCombo.plus_minus}</p>
              </div>
            </div>
          </div>
        ) : (
          <p>No line combos match the attending roster yet.</p>
        )}
      </section>

      <section className="section">
        <h2>Eligible line rankings</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Line</th>
              <th>+/-</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((combo, index) => (
              <tr
                key={`${combo.lw.player}-${combo.c.player}-${combo.rw.player}-${index}`}
              >
                <td>
                  {combo.lw.player} · {combo.c.player} · {combo.rw.player}
                </td>
                <td>{combo.plus_minus}</td>
                <td>
                  <span className="score-pill">{combo.score.toFixed(1)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footer-note">
          Scoring formula: sum of line plus/minus values derived from goal events.
        </p>
      </section>
    </main>
  );
}
