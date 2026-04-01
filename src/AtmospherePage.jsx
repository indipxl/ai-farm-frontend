import { useState } from "react";

const HEATMAP_DATA = (() => {
    const cells = [];
    const tempValues = [
    28, 29, 31, 34, 33, 32, 30, 28,
    27, 30, 32, 35, 34, 33, 31, 29,
    26, 29, 31, 33, 35, 34, 32, 30,
    27, 28, 30, 32, 34, 33, 31, 29,
    26, 27, 29, 31, 32, 31, 30, 28,
    25, 26, 28, 29, 30, 29, 28, 27,
    ];
    tempValues.forEach((t) => {
        const norm = (t - 24) / 12;
        let bg;
        if (norm < 0.25) bg = `rgba(41, 128, 185, ${0.5 + norm})`
        else if (norm <0.5) bg = `rgba(39 ,174, 96, ${0.5 + norm * 0.5})`
        else if (norm < 0.75) bg = `rgba(243, 156, 18, ${0.5 + norm * 0.4})`
        else bg = `rgba(231, 76, 60${0.6 + norm * 0.3})`
        cells.push({ temp: t, bg})
    })
    return cells
})();

const WEATHER = [
  { day: "Today", icon: "⛅", temp: "32°C", rain: "10%", today: true },
  { day: "Mon",   icon: "🌧️", temp: "27°C", rain: "80%" },
  { day: "Tue",   icon: "🌦️", temp: "28°C", rain: "45%" },
  { day: "Wed",   icon: "☀️",  temp: "33°C", rain: "5%"  },
  { day: "Thu",   icon: "☀️",  temp: "34°C", rain: "5%"  },   
]

const SPRAY_WINDOWS = [
  { time: "05:30 – 07:30", desc: "Ideal. Low wind, no rain, cool temp.",              dot: "safe"    },
  { time: "08:00 – 11:00", desc: "Acceptable. Monitor wind speed.",                   dot: "caution" },
  { time: "11:00 – 16:00", desc: "Avoid. High temp causes rapid evaporation.",        dot: "unsafe"  },
  { time: "17:30 – 19:30", desc: "Good. Calm evening conditions expected.",           dot: "safe"    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AtmospherePage() {
  const [heatType, setHeatType] = useState("Temperature");
 
  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Live Atmospheric Data · Updated 4 min ago</div>
          <h1 className="fs-page-title">Atmosphere <em>Monitor</em></h1>
          <p className="fs-page-sub">Temperature, humidity, and wind across all farm blocks · Spray window guidance included</p>
        </div>
        <div className="fs-filter-group">
          {["Temperature", "Humidity", "Wind"].map(t => (
            <button
              key={t}
              className={`fs-filter-pill ${heatType === t ? "fs-filter-pill--active" : ""}`}
              onClick={() => setHeatType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
 
      {/* Map */}
      <div className="bg-card rounded-xl border border-border overflow-hidden h-[350px] mt-10">
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=116.00,5.90,116.20,6.10&layer=mapnik"
          className="w-full h-full border-0"
          title="Map of Sabah monitoring locations"
        />
      </div>
 
      <br />
 
      {/* Stats */}
      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--red"><div className="fs-stat-card__label">Max Temp (Block A)</div><div className="fs-stat-card__val fs-stat-card__val--danger">35°C</div><div className="fs-stat-card__meta">Stress threshold &gt;33°C</div><span className="fs-stat-tag fs-stat-tag--danger">High</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Avg Humidity</div><div className="fs-stat-card__val fs-stat-card__val--warn">66%</div><div className="fs-stat-card__meta">Optimal 60–75%</div><span className="fs-stat-tag fs-stat-tag--warn">Monitor</span></div>
        <div className="fs-stat-card fs-stat-card--blue"><div className="fs-stat-card__label">Wind Speed</div><div className="fs-stat-card__val fs-stat-card__val--blue">12</div><div className="fs-stat-card__meta">km/h · Direction NE</div><span className="fs-stat-tag fs-stat-tag--blue">Moderate</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Spray Windows Today</div><div className="fs-stat-card__val">2</div><div className="fs-stat-card__meta">Safe windows available</div><span className="fs-stat-tag fs-stat-tag--good">Next: 17:30</span></div>
      </div>
 
      <div className="fs-grid-2" style={{ alignItems: "start" }}>
 
        {/* Heatmap */}
        <div className="fs-card">
          <div className="fs-card__header">
            <div>
              <div className="fs-card__title">{heatType} Heat Map</div>
              <div className="fs-card__sub">All farm blocks · Live readings</div>
            </div>
          </div>
          <div className="fs-card__body">
            <div className="fs-heatmap-grid">
              {HEATMAP_DATA.map((cell, i) => (
                <div key={i} className="fs-heatmap-cell" style={{ background: cell.bg }} title={`${cell.temp}°C`}>
                  <span className="fs-heatmap-cell__label">{cell.temp}°</span>
                </div>
              ))}
            </div>
            <div className="fs-heatmap-legend">
              <span className="fs-heatmap-legend__label">Cool</span>
              <div className="fs-heatmap-legend__bar" />
              <span className="fs-heatmap-legend__label">Hot</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="fs-suggestion">
                <div className="fs-suggestion__label">AI Atmospheric Insight</div>
                Heat concentration in Blocks A1–A2 is at stress-inducing levels. Combined with low soil moisture (42%), risk of further blight spread is elevated. Consider emergency irrigation and shade netting for Block A.
              </div>
            </div>
          </div>
        </div>
 
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
 
          {/* Weather forecast */}
          <div className="fs-card">
            <div className="fs-card__header">
              <div>
                <div className="fs-card__title">5-Day Weather Forecast</div>
                <div className="fs-card__sub">Kota Kinabalu · FARM-KK-001</div>
              </div>
            </div>
            <div className="fs-card__body">
              <div className="fs-weather-strip">
                {WEATHER.map(w => (
                  <div key={w.day} className={`fs-weather-day${w.today ? " fs-weather-day--today" : ""}`}>
                    <div className="fs-weather-day__name">{w.day}</div>
                    <span className="fs-weather-day__icon">{w.icon}</span>
                    <div className="fs-weather-day__temp">{w.temp}</div>
                    <div className="fs-weather-day__rain">🌧 {w.rain}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(212,133,26,0.08)", borderRadius: 9, border: "1px solid rgba(212,133,26,0.25)", fontSize: "0.77rem", color: "var(--dark)" }}>
                <strong style={{ color: "var(--amber)" }}>⚠ Rain alert Monday:</strong> 80% chance of heavy rain. Avoid fungicide application Sunday afternoon — active ingredients will wash off.
              </div>
            </div>
          </div>
 
          {/* Spray windows */}
          <div className="fs-card">
            <div className="fs-card__header">
              <div>
                <div className="fs-card__title">Today's Spray Windows</div>
                <div className="fs-card__sub">Based on wind, temp &amp; rain forecast</div>
              </div>
            </div>
            <div className="fs-card__body">
              {SPRAY_WINDOWS.map((w, i) => (
                <div key={i} className="fs-spray-window">
                  <div className={`fs-spray-dot fs-spray-dot--${w.dot}`} />
                  <div className="fs-spray-time">{w.time}</div>
                  <div className="fs-spray-desc">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
 
        </div>
      </div>
    </>
  );
}