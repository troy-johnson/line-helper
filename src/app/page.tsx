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

type PlayerStat = {
  player: string;
  position: "LW" | "C" | "RW";
  plus_minus: number;
};

type LineCombo = {
  lw: PlayerStat;
  c: PlayerStat;
  rw: PlayerStat;
  plus_minus: number;
  score: number;
};

const parseCsv = (contents: string): PlayerStat[] => {
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
        player: record.player,
        position: record.position as PlayerStat["position"],
        plus_minus: Number(record.plus_minus)
      };
    });
};

const scoreLine = (plusMinus: number) => plusMinus;

const loadPlayerData = (): PlayerStat[] => {
  const filePath = path.join(process.cwd(), "data", "players.csv");
  const contents = fs.readFileSync(filePath, "utf8");
  return parseCsv(contents);
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
  const players = loadPlayerData();
  const attendingRoster = players.filter((player) =>
    attendingPlayers.includes(player.player)
  );
  const combos = buildLineCombos(attendingRoster);
  const topCombo = combos[0];

  return (
    <main>
      <section className="section">
        <h1>Line Helper</h1>
        <p>
          Track last game data by skater using only plus/minus for now. Use the
          roster list below to create the best LW-C-RW combinations for the next
          game.
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
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {attendingRoster.map((player) => (
              <tr key={player.player}>
                <td>{player.player}</td>
                <td>{player.position}</td>
                <td>{player.plus_minus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footer-note">
          Expand the CSV with shots and quality chances when you are ready to
          track deeper defensive impact.
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
          Scoring formula: sum of line plus/minus values. Add more metrics when
          you are ready to weigh defense, shots, or quality chances.
        </p>
      </section>
    </main>
  );
}
