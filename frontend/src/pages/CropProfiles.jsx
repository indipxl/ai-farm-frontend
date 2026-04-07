import { useState, useEffect } from "react";
import { useCrops } from "../useCrops";

export default function CropProfilesPage() {
  const { crops: CROP_PROFILES = [] } = useCrops();
  const [selected, setSelected] = useState(null);
  const [vals, setVals] = useState({ moisture: 70, temp: 26, humidity: 65, ph: 64 });
  const profile = selected ? CROP_PROFILES.find(p => p.id === selected) : null;

  useEffect(() => {
    if (profile?.sensor_data) {
      setVals({
        moisture: profile.sensor_data.soil?.moisture || 0,
        temp: profile.sensor_data.air?.temp || 0,
        humidity: profile.sensor_data.air?.hum || 0,
        ph: profile.sensor_data.soil?.ph ? profile.sensor_data.soil.ph * 10 : 0
      });
    }
  }, [profile]);

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Custom Crop Configuration</div>
          <h1 className="fs-page-title">Crop <em>Profiles</em></h1>
          <p className="fs-page-sub">Set your own target ranges per crop — AI will alert based on your thresholds, not generic defaults</p>
        </div>
      </div>

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Active Profiles</div><div className="fs-stat-card__val">{CROP_PROFILES.length}</div><div className="fs-stat-card__meta">Custom Profile</div><span className="fs-stat-tag fs-stat-tag--good">All active</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Batches Covered</div><div className="fs-stat-card__val">6</div><div className="fs-stat-card__meta">All batches assigned</div><span className="fs-stat-tag fs-stat-tag--good">Complete</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Custom Alerts</div><div className="fs-stat-card__val fs-stat-card__val--warn">4</div><div className="fs-stat-card__meta">Profile-based triggers</div><span className="fs-stat-tag fs-stat-tag--warn">Active</span></div>
        <div className="fs-stat-card fs-stat-card--purple"><div className="fs-stat-card__label">AI Optimisations</div><div className="fs-stat-card__val">12</div><div className="fs-stat-card__meta">Suggested adjustments</div><span className="fs-stat-tag fs-stat-tag--good">Review</span></div>
      </div>

      <div className="fs-grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="fs-section-row">
            <div className="fs-section-label">My Crop Profile</div>
            <button className="fs-btn fs-btn--gold fs-btn--sm">+ New Crop</button>
          </div>

          <div className="fs-profile-grid" style={{ gridTemplateColumns: "1fr" }}>
            {CROP_PROFILES.map((p, i) => (
              <div
                key={p.id}
                className="fs-profile-card"
                style={{ animationDelay: `${0.05 + i * 0.07}s`, outline: selected === p.id ? "2px solid var(--gold)" : "none", outlineOffset: 2, cursor: "pointer" }}
                onClick={() => setSelected(selected === p.id ? null : p.id)}
              >
                <div className="fs-profile-card__top">
                  <span className="fs-profile-card__emoji">{p.emoji}</span>
                  <div>
                    <div className="fs-profile-card__name">{p.name}</div>
                    <div className="fs-profile-card__type">{p.type}</div>
                  </div>
                  <span className="fs-pill fs-pill--healthy" style={{ marginLeft: "auto" }}>Active</span>
                </div>
                <div className="fs-profile-card__body">
                  <div className="fs-recipe-params">
                    {p.params && p.params.map(param => (
                      <div key={param.name}>
                        <div className="fs-recipe-param__row">
                          <span className="fs-recipe-param__name">{param.name}</span>
                          <span className="fs-recipe-param__val">{param.min}–{param.max}{param.unit}</span>
                        </div>
                        <div className="fs-recipe-param__bar">
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fs-profile-card__footer">
                  <div className="fs-profile-card__assigned">Assigned to <strong>{p.batch_id || p.assignedTo || 'Unassigned'}</strong></div>
                  <button className="fs-btn fs-btn--ghost fs-btn--sm" onClick={e => { e.stopPropagation(); setSelected(p.id); }}>Edit Crop Profile</button>
                </div>
              </div>
            ))}

            <div className="fs-profile-card fs-profile-card--add" onClick={() => alert("New profile wizard — set crop type, target ranges, and alert thresholds.")}>
              <span style={{ fontSize: "1.8rem" }}>+</span>
              <span>Create New Crop Profile</span>
            </div>
          </div>
        </div>

        <div>
          {profile ? (
            <div className="fs-recipe-editor">
              <div className="fs-recipe-editor__title">{profile.emoji} {profile.name}</div>
              <div className="fs-recipe-editor__sub">Adjust target ranges — AI alerts trigger when readings fall outside these bounds</div>
              <div className="fs-recipe-editor__grid">
                <div className="fs-range-row">
                  <label>Soil Moisture (%) <span>{vals.moisture}%</span></label>
                  <input type="range" min={30} max={95} value={vals.moisture} onChange={e => setVals(v => ({ ...v, moisture: +e.target.value }))} />
                </div>
                <div className="fs-range-row">
                  <label>Temperature (°C) <span>{vals.temp}°C</span></label>
                  <input type="range" min={15} max={40} value={vals.temp} onChange={e => setVals(v => ({ ...v, temp: +e.target.value }))} />
                </div>
                <div className="fs-range-row">
                  <label>Humidity (%) <span>{vals.humidity}%</span></label>
                  <input type="range" min={30} max={95} value={vals.humidity} onChange={e => setVals(v => ({ ...v, humidity: +e.target.value }))} />
                </div>
                <div className="fs-range-row">
                  <label>Soil pH <span>{(vals.ph / 10).toFixed(1)}</span></label>
                  <input type="range" min={40} max={80} value={vals.ph} onChange={e => setVals(v => ({ ...v, ph: +e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Alert Condition</div>
                <div style={{ background: "var(--cream2)", borderRadius: 8, padding: "10px 12px", fontSize: "0.77rem", color: "var(--dark)", border: "1px solid var(--border)" }}>{profile.alert}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Farmer Notes / Custom Recipe</div>
                <textarea className="fs-textarea" rows={3} defaultValue={profile.notes} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="fs-btn fs-btn--gold" style={{ flex: 1, justifyContent: "center" }}>Edit Profile</button>
                <button className="fs-btn fs-btn--ghost" onClick={() => setSelected(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="fs-card">
              <div className="fs-card__body" style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🌱</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>Select a profile to edit</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 1.6 }}>Click any crop profile on the left to open the recipe editor and customise your target thresholds and alert conditions.</div>
              </div>
            </div>
          )}

          {profile && (
            <div className="fs-card" style={{ marginTop: 18 }}>
              <div className="fs-card__header">
                <div>
                  <div className="fs-card__title">AI Profile Suggestions</div>
                  <div className="fs-card__sub">Based on your current readings &amp; crop type</div>
                </div>
              </div>
              <div className="fs-card__body">
                <div className="fs-suggestion" style={{ marginBottom: 10 }}>
                  <div className="fs-suggestion__label">Optimisation</div>
                  Your moisture threshold (current: {vals.moisture}%) is slightly high for {profile.name}. Research suggests {profile.params?.[0]?.min ?? 0}–{profile.params?.[0]?.max ?? 0}% reduces fungal risk without stress.
                </div>
                <div className="fs-suggestion">
                  <div className="fs-suggestion__label">Seasonal Adjustment</div>
                  March–April is peak humidity season in Kota Kinabalu. Consider lowering your humidity alert threshold to 70% to get earlier warnings before fungal conditions develop.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}