const SOIL_BLOCKS = [
  {
    id: "A", crop: "🍅 Tomatoes", loc: "Block A", score: 48, grade: "poor",
    metrics: [{ name: "Moisture", val: "42%", state: "bad" }, { name: "pH", val: "5.8", state: "warn" }, { name: "Nitrogen", val: "Low", state: "bad" }, { name: "Phosphorus", val: "Med", state: "warn" }],
    bars: [{ name: "Moisture", pct: 42, state: "bad" }, { name: "Organic Matter", pct: 30, state: "warn" }, { name: "Nitrogen (N)", pct: 25, state: "bad" }]
  },
  {
    id: "B", crop: "🥬 Lettuce", loc: "Block B", score: 67, grade: "ok",
    metrics: [{ name: "Moisture", val: "58%", state: "warn" }, { name: "pH", val: "6.4", state: "ok" }, { name: "Nitrogen", val: "Med", state: "warn" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 58, state: "warn" }, { name: "Organic Matter", pct: 54, state: "ok" }, { name: "Nitrogen (N)", pct: 48, state: "warn" }]
  },
  {
    id: "C", crop: "🫑 Peppers", loc: "Block C", score: 89, grade: "great",
    metrics: [{ name: "Moisture", val: "70%", state: "ok" }, { name: "pH", val: "6.8", state: "ok" }, { name: "Nitrogen", val: "Good", state: "ok" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 70, state: "ok" }, { name: "Organic Matter", pct: 78, state: "ok" }, { name: "Nitrogen (N)", pct: 82, state: "ok" }]
  },
  {
    id: "D", crop: "🥒 Cucumber", loc: "Block D", score: 85, grade: "great",
    metrics: [{ name: "Moisture", val: "74%", state: "ok" }, { name: "pH", val: "6.5", state: "ok" }, { name: "Nitrogen", val: "Good", state: "ok" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 74, state: "ok" }, { name: "Organic Matter", pct: 70, state: "ok" }, { name: "Nitrogen (N)", pct: 76, state: "ok" }]
  },
  {
    id: "E", crop: "🍓 Strawberry", loc: "Block E", score: 81, grade: "great",
    metrics: [{ name: "Moisture", val: "68%", state: "ok" }, { name: "pH", val: "5.9", state: "ok" }, { name: "Nitrogen", val: "Good", state: "ok" }, { name: "Phosphorus", val: "Med", state: "warn" }],
    bars: [{ name: "Moisture", pct: 68, state: "ok" }, { name: "Organic Matter", pct: 65, state: "ok" }, { name: "Nitrogen (N)", pct: 70, state: "ok" }]
  },
  {
    id: "F", crop: "🫛 Long Beans", loc: "Block F", score: 74, grade: "ok",
    metrics: [{ name: "Moisture", val: "66%", state: "ok" }, { name: "pH", val: "6.2", state: "ok" }, { name: "Nitrogen", val: "Med", state: "warn" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 66, state: "ok" }, { name: "Organic Matter", pct: 60, state: "ok" }, { name: "Nitrogen (N)", pct: 52, state: "warn" }]
  },
];

export default function SoilPage() {
  const avgScore = Math.round(SOIL_BLOCKS.reduce((s, b) => s + b.score, 0) / SOIL_BLOCKS.length);
  const gradeLabel = { great: "Excellent", ok: "Moderate", poor: "Poor" };

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Soil Sensor Data · Synced 4 min ago</div>
          <h1 className="fs-page-title">Soil <em>Health</em></h1>
          <p className="fs-page-sub">Moisture, pH, and nutrient levels across all 6 active blocks</p>
        </div>
      </div>

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Farm Avg. Soil Score</div><div className="fs-stat-card__val">{avgScore}</div><div className="fs-stat-card__meta">Out of 100</div><span className="fs-stat-tag fs-stat-tag--warn">Needs work</span></div>
        <div className="fs-stat-card fs-stat-card--red"><div className="fs-stat-card__label">Critical Blocks</div><div className="fs-stat-card__val fs-stat-card__val--danger">1</div><div className="fs-stat-card__meta">Block A below threshold</div><span className="fs-stat-tag fs-stat-tag--danger">Act now</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Avg. Soil Moisture</div><div className="fs-stat-card__val fs-stat-card__val--warn">61%</div><div className="fs-stat-card__meta">2 blocks below optimal</div><span className="fs-stat-tag fs-stat-tag--warn">Low</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Optimal Blocks</div><div className="fs-stat-card__val">3</div><div className="fs-stat-card__meta">Score &gt; 80</div><span className="fs-stat-tag fs-stat-tag--good">Healthy</span></div>
      </div>

      <div className="fs-section-row">
        <div className="fs-section-label">Block-by-Block Soil Analysis</div>
        <button className="fs-btn fs-btn--ghost fs-btn--sm">⬇ Export Report</button>
      </div>

      <div className="fs-soil-block-grid">
        {SOIL_BLOCKS.map((blk, i) => (
          <div key={blk.id} className={`fs-soil-block${blk.grade === "poor" ? " fs-soil-block--danger" : blk.grade === "ok" ? " fs-soil-block--warn" : ""}`} style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
            <div className="fs-soil-block__header">
              <div>
                <div className="fs-soil-block__name">{blk.crop}</div>
                <div className="fs-soil-block__loc">📍 {blk.loc}</div>
              </div>
              <span className={`fs-pill ${blk.grade === "great" ? "fs-pill--healthy" : blk.grade === "ok" ? "fs-pill--warning" : "fs-pill--danger"}`}>{gradeLabel[blk.grade]}</span>
            </div>
            <div className="fs-soil-score">
              <div className={`fs-soil-score__ring fs-soil-score__ring--${blk.grade}`}>{blk.score}</div>
              <div className="fs-soil-score__label">Soil Health Score</div>
            </div>
            <div className="fs-soil-metrics">
              {blk.metrics.map(m => (
                <div key={m.name} className="fs-soil-metric">
                  <div className="fs-soil-metric__name">{m.name}</div>
                  <div className={`fs-soil-metric__val fs-soil-metric__val--${m.state}`}>{m.val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              {blk.bars.map(bar => (
                <div key={bar.name} className="fs-progress-bar-wrap">
                  <div className="fs-progress-label"><span>{bar.name}</span><span>{bar.pct}%</span></div>
                  <div className="fs-progress-bar">
                    <div className={`fs-progress-bar__fill fs-progress-bar__fill--${bar.state}`} style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fs-card">
        <div className="fs-card__header">
          <div>
            <div className="fs-card__title">AI Soil Recommendations</div>
            <div className="fs-card__sub">Priority actions based on current readings</div>
          </div>
        </div>
        <div className="fs-card__body">
          <div className="fs-grid-2" style={{ marginBottom: 0 }}>
            <div className="fs-suggestion"><div className="fs-suggestion__label">Block A — Critical</div>Immediately irrigate to raise moisture above 55%. Apply nitrogen-rich organic fertiliser (compost or blood meal). Re-test pH and add agricultural lime if below 6.0. Re-scan in 48 hours.</div>
            <div className="fs-suggestion"><div className="fs-suggestion__label">Block B — Moderate</div>Increase irrigation frequency by 15%. Side-dress with balanced NPK. Organic matter levels suggest need for compost application before next planting cycle.</div>
          </div>
        </div>
      </div>
    </>
  );
}