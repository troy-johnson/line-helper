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

type LineCombo = {
  line_id: string;
  lw: string;
  c: string;
  rw: string;
  plus_minus: number;
  shots_for: number;
  shots_against: number;
  quality_for: number;
  quality_against: number;
};

const parseCsv = (contents: string): LineCombo[] => {
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
        line_id: record.line_id,
        lw: record.lw,
        c: record.c,
        rw: record.rw,
        plus_minus: Number(record.plus_minus),
        shots_for: Number(record.shots_for),
        shots_against: Number(record.shots_against),
        quality_for: Number(record.quality_for),
        quality_against: Number(record.quality_against)
      };
    });
};

const scoreLine = (line: LineCombo) => {
  const qualityDiff = line.quality_for - line.quality_against;
  const shotDiff = line.shots_for - line.shots_against;
  return line.plus_minus * 2 + qualityDiff + shotDiff * 0.5;
};

const loadLineData = (): LineCombo[] => {
  const filePath = path.join(process.cwd(), "data", "line-combos.csv");
  const contents = fs.readFileSync(filePath, "utf8");
  return parseCsv(contents);
};

export default function Home() {
  const combos = loadLineData();
  const eligibleCombos = combos.filter((combo) =>
    [combo.lw, combo.c, combo.rw].every((player) =>
      attendingPlayers.includes(player)
    )
  );
  const rankedCombos = [...eligibleCombos]
    .map((combo) => ({
      ...combo,
      score: scoreLine(combo)
    }))
    .sort((a, b) => b.score - a.score);
  const topCombo = rankedCombos[0];

  return (
    <main>
      <section className="section">
        <h1>Line Helper</h1>
        <p>
          Track last game data in a simple CSV and quickly see which LW-C-RW
          combos are driving results. This view ranks the eligible lines using a
          blend of +/- and quality chance differential.
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
        <h2>Best projected line</h2>
        {topCombo ? (
          <div className="card">
            <h3>
              {topCombo.lw} · {topCombo.c} · {topCombo.rw}
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
            {rankedCombos.map((combo) => (
              <tr key={combo.line_id}>
                <td>
                  {combo.lw} · {combo.c} · {combo.rw}
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
          (shot differential × 0.5). Update this to match your team’s priorities
          as you collect more games.
        </p>
      </section>
    </main>
  );
}
