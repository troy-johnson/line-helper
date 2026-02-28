import fs from "fs";
import path from "path";
import {
  parseCsv,
  buildPlayerStats,
  buildLineCombos,
} from "@/lib/stats";

const DEFAULT_ATTENDING = [
  "Alex Mercer",
  "Jordan Pike",
  "Sam Keller",
  "Taylor Reed",
  "Chris Nolan",
  "Mason Cole",
];

const loadGoalData = () => {
  const filePath = path.join(process.cwd(), "data", "players.csv");
  const contents = fs.readFileSync(filePath, "utf8");
  return parseCsv(contents);
};

export default function Home({
  searchParams,
}: {
  searchParams: { attending?: string };
}) {
  const attendingPlayers = searchParams.attending
    ? searchParams.attending.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_ATTENDING;

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
        <p className="footer-note">
          Tip: override the roster with{" "}
          <code>?attending=Player+One,Player+Two</code> in the URL.
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
              Projected score:{" "}
              <span className="score-pill">{topCombo.score.toFixed(1)}</span>
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
          Scoring formula: sum of line plus/minus values derived from goal
          events.
        </p>
      </section>
    </main>
  );
}
