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
  shots_for: number;
  shots_against: number;
  quality_for: number;
  quality_against: number;
};

type LineCombo = {
  lw: PlayerStat;
  c: PlayerStat;
  rw: PlayerStat;
  plus_minus: number;
  shots_for: number;
  shots_against: number;
  quality_for: number;
  quality_against: number;
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
        plus_minus: Number(record.plus_minus),
        shots_for: Number(record.shots_for),
        shots_against: Number(record.shots_against),
        quality_for: Number(record.quality_for),
        quality_against: Number(record.quality_against)
      };
    });
};

const scoreLine = (plusMinus: number, qualityDiff: number, shotDiff: number) =>
  plusMinus * 2 + qualityDiff + shotDiff * 0.5;

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
        const shotsFor = lw.shots_for + c.shots_for + rw.shots_for;
        const shotsAgainst = lw.shots_against + c.shots_against + rw.shots_against;
        const qualityFor = lw.quality_for + c.quality_for + rw.quality_for;
        const qualityAgainst =
          lw.quality_against + c.quality_against + rw.quality_against;
        const qualityDiff = qualityFor - qualityAgainst;
        const shotDiff = shotsFor - shotsAgainst;

        combos.push({
          lw,
          c,
          rw,
          plus_minus: plusMinus,
          shots_for: shotsFor,
          shots_against: shotsAgainst,
          quality_for: qualityFor,
          quality_against: qualityAgainst,
          score: scoreLine(plusMinus, qualityDiff, shotDiff)
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
          Track last game data by skater to capture how each player impacts both
          offense and defense. Use the roster list below to create the best LW-C-RW
          combinations for the next game.
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
              <th>Quality For</th>
              <th>Quality Against</th>
              <th>Shots For</th>
              <th>Shots Against</th>
            </tr>
          </thead>
          <tbody>
            {attendingRoster.map((player) => (
              <tr key={player.player}>
                <td>{player.player}</td>
                <td>{player.position}</td>
                <td>{player.plus_minus}</td>
                <td>{player.quality_for}</td>
                <td>{player.quality_against}</td>
                <td>{player.shots_for}</td>
                <td>{player.shots_against}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footer-note">
          Tracking against stats helps surface defensive impact for each skater.
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
              <div>
                <p>Quality chances</p>
                <p className="highlight">
                  {topCombo.quality_for} for / {topCombo.quality_against} against
                </p>
              </div>
              <div>
                <p>Shot attempts</p>
                <p className="highlight">
                  {topCombo.shots_for} for / {topCombo.shots_against} against
                </p>
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
              <th>Quality For</th>
              <th>Quality Against</th>
              <th>Shots For</th>
              <th>Shots Against</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((combo, index) => (
              <tr key={`${combo.lw.player}-${combo.c.player}-${combo.rw.player}-${index}`}>
                <td>
                  {combo.lw.player} · {combo.c.player} · {combo.rw.player}
                </td>
                <td>{combo.plus_minus}</td>
                <td>{combo.quality_for}</td>
                <td>{combo.quality_against}</td>
                <td>{combo.shots_for}</td>
                <td>{combo.shots_against}</td>
                <td>
                  <span className="score-pill">{combo.score.toFixed(1)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footer-note">
          Scoring formula: (plus/minus × 2) + quality chance differential +
          (shot differential × 0.5). Adjust weights as you refine how defensive
          impact should be valued.
        </p>
      </section>
    </main>
  );
}
