import React, { useState } from "react";
import { useBatches } from "../useBatches";
import { useFarmSettings } from "../useFarmSettings";
import { useDiseasePrediction } from "../useDiseasePrediction";

export default function DiseaseMapPage() {
  const { batches, loading: batchesLoading } = useBatches();
  const { settings, loading: settingsLoading } = useFarmSettings();
  const { prediction, loading: predictionLoading, error, analyzeDiseaseSpread } = useDiseasePrediction();

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [mode, setMode] = useState("soil_borne"); // "soil_borne" or "air_borne"

  if (settingsLoading || batchesLoading) {
    return <div className="fs-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="fs-spinner"></div></div>;
  }

  const blocks = settings?.blocks || [];
  const maxRow = blocks.length > 0 ? Math.max(...blocks.map(b => b.row)) : 0;
  const maxCol = blocks.length > 0 ? Math.max(...blocks.map(b => b.col)) : 0;

  const gridRows = maxRow + 1;
  const gridCols = maxCol + 1;
  const rows = Array.from({ length: gridRows }, (_, i) => i);
  const cols = Array.from({ length: gridCols }, (_, i) => i);

  const getBatchAt = (locId) => {
    return (batches || []).find(b => b.location && (b.location.toUpperCase() === locId.toUpperCase() || b.location.toUpperCase() === `BLOCK ${locId.toUpperCase()}`));
  };

  const getBlockPrediction = (blockId) => {
    if (!prediction || !prediction.blocks) return null;
    return prediction.blocks.find(b => b.block_id === blockId);
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel === 'High') return 'var(--red)';
    if (riskLevel === 'Medium') return 'var(--amber)';
    if (riskLevel === 'Low') return 'var(--green-lt)';
    return 'var(--cream3)'; // Empty or No risk
  };

  const statusLabel = { healthy: "Healthy", warning: "Warning", danger: "Danger" };
  const pillCls = { healthy: "fs-pill--healthy", warning: "fs-pill--warning", danger: "fs-pill--danger" };

  // Calculate dynamic stats
  let activeSoilThreats = 0;
  let soilBlocksAtRisk = 0;
  let activeAirThreats = 0;
  let airBlocksAtRisk = 0;
  let threatLog = [];

  if (prediction && prediction.blocks) {
    prediction.blocks.forEach(b => {
      if (b.soil_borne) {
        if (b.soil_borne.risk_level === 'High') activeSoilThreats++;
        else if (b.soil_borne.risk_level === 'Medium') soilBlocksAtRisk++;
      }
      if (b.air_borne) {
        if (b.air_borne.risk_level === 'High') activeAirThreats++;
        else if (b.air_borne.risk_level === 'Medium') airBlocksAtRisk++;
      }

      // Threat log remains mode-specific
      const riskData = mode === "soil_borne" ? b.soil_borne : b.air_borne;
      if (riskData) {
        if (riskData.risk_level === 'High') {
          if (riskData.disease_name && riskData.disease_name !== "None") {
            threatLog.push({
              block_id: b.block_id,
              icon: "🔴",
              title: `[Block ${b.block_id}] ${riskData.disease_name} Threat`,
              desc: riskData.reason || `High risk of ${mode.replace('_', ' ')} spread.`,
              meta: "AI Forecast · High risk",
              type: "danger"
            });
          }
        }
        if (riskData.risk_level === 'Medium') {
          if (riskData.disease_name && riskData.disease_name !== "None") {
            threatLog.push({
              block_id: b.block_id,
              icon: "🟡",
              title: `[Block ${b.block_id}] Elevated Risk`,
              desc: riskData.reason || `Moderate risk of ${mode.replace('_', ' ')} spread.`,
              meta: "AI Forecast · Moderate risk",
              type: "warn"
            });
          }
        }
      }
    });
  }

  // Sort threat log alphabetically by block name
  threatLog.sort((a, b) => a.block_id.localeCompare(b.block_id));

  // Fallback threat log if empty so it doesn't look completely bare
  if (threatLog.length === 0 && !predictionLoading) {
    threatLog.push({
      block_id: "NONE",
      icon: "🛡️",
      title: "No Immediate Threats Detected",
      desc: "AI analysis currently shows no high-risk spread vectors for the selected mode.",
      meta: "System Clear",
      type: "resolved"
    });
  }

  return (
    <>
      <div className="fs-page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="fs-page-title">Disease <em></em> Map</h1>
          <p className="fs-page-sub">Track spread vectors across all blocks</p>
        </div>
      </div>



      {error && (
        <div style={{ background: 'var(--red)', color: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          Error running AI Prediction: {error}
        </div>
      )}

      <div className="fs-stat-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="fs-stat-card fs-stat-card--red">
          <div className="fs-stat-card__label">Soil High Threats</div>
          <div className="fs-stat-card__val fs-stat-card__val--danger">{activeSoilThreats}</div>
          <div className="fs-stat-card__meta">Soil-borne diseases</div>
          <span className={`fs-stat-tag ${activeSoilThreats > 0 ? "fs-stat-tag--danger" : "fs-stat-tag--good"}`}>
            {activeSoilThreats > 0 ? "High risk" : "All Clear"}
          </span>
        </div>
        <div className="fs-stat-card fs-stat-card--amber">
          <div className="fs-stat-card__label">Soil Blocks at Risk</div>
          <div className="fs-stat-card__val fs-stat-card__val--warn">{soilBlocksAtRisk}</div>
          <div className="fs-stat-card__meta">Soil-borne spread</div>
          <span className={`fs-stat-tag ${soilBlocksAtRisk > 0 ? "fs-stat-tag--warn" : "fs-stat-tag--good"}`}>
            {soilBlocksAtRisk > 0 ? "Monitor" : "Clear"}
          </span>
        </div>
        <div className="fs-stat-card fs-stat-card--red">
          <div className="fs-stat-card__label">Air High Threats</div>
          <div className="fs-stat-card__val fs-stat-card__val--danger">{activeAirThreats}</div>
          <div className="fs-stat-card__meta">Air-borne diseases</div>
          <span className={`fs-stat-tag ${activeAirThreats > 0 ? "fs-stat-tag--danger" : "fs-stat-tag--good"}`}>
            {activeAirThreats > 0 ? "High risk" : "All Clear"}
          </span>
        </div>
        <div className="fs-stat-card fs-stat-card--amber">
          <div className="fs-stat-card__label">Air Blocks at Risk</div>
          <div className="fs-stat-card__val fs-stat-card__val--warn">{airBlocksAtRisk}</div>
          <div className="fs-stat-card__meta">Air-borne spread</div>
          <span className={`fs-stat-tag ${airBlocksAtRisk > 0 ? "fs-stat-tag--warn" : "fs-stat-tag--good"}`}>
            {airBlocksAtRisk > 0 ? "Monitor" : "Clear"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "2rem" }}>
        <div>
          {/* Spread prediction AI Summary */}
          {prediction && (
            <div className="fs-card" style={{ marginBottom: 18, borderLeft: "4px solid var(--primary)" }}>
              <div className="fs-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="fs-card__title">Spread Forecast</div>
                </div>
                <button
                  onClick={analyzeDiseaseSpread}
                  className="fs-btn fs-btn--primary"
                  disabled={predictionLoading}
                >
                  {predictionLoading ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>
              <div className="fs-card__body">
                <div className="fs-suggestion">
                  {prediction.weather_summary}
                </div>
              </div>
            </div>
          )}

          {/* Farm block map */}
          <div className="fs-card" style={{ marginBottom: 18 }}>
            <div className="fs-card__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              {/* <div>
                <div className="fs-card__title">Farm Batch Map</div>
                <div className="fs-card__sub">Colored by AI predicted risk · Click blocks for sensor details</div>
              </div> */}
              <div style={{ display: 'flex', gap: '8px', background: 'var(--cream2)', padding: '4px', borderRadius: '8px' }}>
                <button
                  className={`fs-btn fs-btn--sm ${mode === 'soil_borne' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                  style={mode !== 'soil_borne' ? { border: 'none' } : {}}
                  onClick={() => setMode('soil_borne')}
                >
                  🌱 Soil Borne
                </button>
                <button
                  className={`fs-btn fs-btn--sm ${mode === 'air_borne' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                  style={mode !== 'air_borne' ? { border: 'none' } : {}}
                  onClick={() => setMode('air_borne')}
                >
                  💨 Air Borne
                </button>
              </div>
            </div>

            <div className="fs-farm-map">
              {blocks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>No layout configured.</div>
              ) : (
                <div className="fs-map-grid" style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(80px, 1fr))`,
                  gridTemplateRows: `repeat(${gridRows}, minmax(80px, 1fr))`
                }}>
                  {rows.map(r => (
                    cols.map(c => {
                      const block = blocks.find(b => b.row === r && b.col === c);
                      if (block) {
                        const liveBatch = getBatchAt(block.label);
                        const blockPred = getBlockPrediction(block.id);
                        let riskData = null;

                        // Only show predictions on the map if there is actually a crop planted there
                        if (blockPred && liveBatch) {
                          riskData = mode === 'soil_borne' ? blockPred.soil_borne : blockPred.air_borne;
                        }

                        const bgColor = riskData ? getRiskColor(riskData.risk_level) : "var(--cream3)";
                        const emoji = liveBatch ? (liveBatch.crop.toLowerCase().includes('chilli') ? '🌶️' : '🌿') : "";

                        return (
                          <div
                            key={block.id}
                            className={`fs-map-block ${liveBatch ? 'fs-map-block--active' : ''}`}
                            title={liveBatch ? `${block.id}: ${liveBatch.crop}` : `${block.id}: Empty`}
                            onClick={() => liveBatch && setSelectedBatch(liveBatch)}
                            style={{
                              cursor: liveBatch ? 'pointer' : 'default',
                              background: bgColor,
                              borderColor: riskData && riskData.risk_level === 'High' ? 'var(--red)' : 'var(--border)'
                            }}
                          >
                            <div className="fs-map-block__label" style={{ color: 'var(--charcoal)' }}>{block.label}</div>
                            {emoji && <div className="fs-map-block__crop">{emoji}</div>}

                            {/* Removed disease name from block to reduce clutter, moved to modal */}

                            <div className="fs-map-block__status" style={{ color: 'var(--charcoal)', fontWeight: 'bold' }}>
                              {riskData ? `${riskData.risk_level} Risk` : (liveBatch ? 'Unscanned' : '–')}
                            </div>

                            {riskData && riskData.needs_scan && (
                              <div style={{ position: 'absolute', top: 5, right: 5, fontSize: '10px' }} title="Needs Image Scan">📸</div>
                            )}
                          </div>
                        );
                      } else {
                        return <div key={`${r}-${c}`} style={{ background: 'transparent' }} />;
                      }
                    })
                  ))}
                </div>
              )}
              <div className="fs-map-legend">
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--red)" }} />High Risk</div>
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--amber)" }} />Medium Risk</div>
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--green-lt)" }} />Low Risk</div>
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--cream3)" }} />No Risk / Empty</div>
              </div>
            </div>
          </div>
        </div>

        {/* Threat log */}
        <div>
          <div className="fs-section-row">
            <div className="fs-section-label">AI Threat Log</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
            {threatLog.map((t, i) => (
              <div key={i} className={`fs-threat-entry${t.type === "danger" ? " fs-threat-entry--danger" : t.type === "warn" ? " fs-threat-entry--warn" : ""}`} style={{ textAlign: 'left', width: '100%' }}>
                <span className="fs-threat-entry__icon">{t.icon}</span>
                <div style={{ textAlign: 'left', width: '100%' }}>
                  <div className="fs-threat-entry__title">{t.title}</div>
                  <div className="fs-threat-entry__desc">{t.desc}</div>
                  <div className="fs-threat-entry__meta">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Modal */}
      {selectedBatch && (
        <div className="fs-modal-overlay" onClick={() => setSelectedBatch(null)} style={{ zIndex: 9999 }}>
          <div className="fs-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ padding: '24px' }}>
              <div className="fs-modal__eyebrow">Sensor Data</div>
              <div className="fs-batch-card__header">
                <div>
                  <div className="fs-batch-card__crop">{selectedBatch.crop}</div>
                  <div className="fs-batch-card__loc">📍 {selectedBatch.location}</div>
                  <div className="fs-batch-card__id">{selectedBatch.id}</div>
                </div>
                <span className={`fs-pill ${pillCls[selectedBatch.status]}`}>{statusLabel[selectedBatch.status]}</span>
              </div>

              <div className="fs-sensor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="fs-sensor-mini">
                  <span className="fs-sensor-mini__icon">🌡️</span>
                  <span className="fs-sensor-mini__name">Temp</span>
                  <span className="fs-sensor-mini__val">{selectedBatch.sensor_data?.air?.temp ?? '--'}°C</span>
                </div>
                <div className="fs-sensor-mini">
                  <span className="fs-sensor-mini__icon">💧</span>
                  <span className="fs-sensor-mini__name">Moisture</span>
                  <span className="fs-sensor-mini__val">{selectedBatch.sensor_data?.soil?.moisture ?? '--'}%</span>
                </div>
                <div className="fs-sensor-mini">
                  <span className="fs-sensor-mini__icon">🌤️</span>
                  <span className="fs-sensor-mini__name">Humidity</span>
                  <span className="fs-sensor-mini__val">{selectedBatch.sensor_data?.air?.hum ?? '--'}%</span>
                </div>
                <div className="fs-sensor-mini">
                  <span className="fs-sensor-mini__icon">⚗️</span>
                  <span className="fs-sensor-mini__name">pH</span>
                  <span className="fs-sensor-mini__val">{selectedBatch.sensor_data?.soil?.ph ?? '--'}</span>
                </div>
              </div>

              {selectedBatch.sensor_data?.soil && (
                <div style={{ background: 'var(--cream2)', borderRadius: '12px', padding: '16px', marginBottom: '0' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Soil Nutrients (NPK mg/kg)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <div style={{ color: 'var(--red)' }}>N: {selectedBatch.sensor_data.soil.est_n}</div>
                    <div style={{ color: 'var(--gold)' }}>P: {selectedBatch.sensor_data.soil.est_p}</div>
                    <div style={{ color: 'var(--green)' }}>K: {selectedBatch.sensor_data.soil.est_k}</div>
                  </div>
                </div>
              )}

              {/* AI Prediction Details */}
              {prediction && (
                (() => {
                  // Reconstruct block ID from batch location safely
                  let loc = selectedBatch.location || "";
                  loc = loc.toUpperCase();
                  if (loc.startsWith("BLOCK ")) {
                    loc = loc.replace("BLOCK ", "");
                  }
                  const blockId = loc.trim();
                  const blockPred = getBlockPrediction(blockId);
                  const riskData = blockPred ? (mode === 'soil_borne' ? blockPred.soil_borne : blockPred.air_borne) : null;

                  if (!riskData) {
                    return (
                      <div style={{ background: 'rgba(46, 204, 113, 0.1)', border: '1px solid var(--green-lt)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800 }}>
                          {mode === 'soil_borne' ? '🌱 Soil Borne Analysis' : '💨 Air Borne Analysis'}
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--charcoal)' }}>No Disease Detected</span>
                          <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--green-lt)', color: 'var(--charcoal)' }}>
                            Low Risk
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-dim)' }}>
                          AI analysis of current sensors and weather patterns indicates no immediate threat of spread to this block.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div style={{
                      background: riskData.risk_level === 'High' ? 'rgba(231, 76, 60, 0.1)' : (riskData.risk_level === 'Medium' ? 'rgba(243, 156, 18, 0.1)' : 'rgba(46, 204, 113, 0.1)'),
                      border: `1px solid ${getRiskColor(riskData.risk_level)}`,
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800 }}>
                        {mode === 'soil_borne' ? '🌱 Soil Borne Analysis' : '💨 Air Borne Analysis'}
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--charcoal)' }}>{riskData.disease_name && riskData.disease_name !== 'None' ? riskData.disease_name : 'No Disease Detected'}</span>
                        <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: getRiskColor(riskData.risk_level), color: riskData.risk_level === 'Low' ? 'var(--charcoal)' : '#fff' }}>
                          {riskData.risk_level} Risk
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-dim)' }}>
                        {riskData.reason}
                      </p>

                      {selectedBatch.image_analysis && (
                        <div className={`fs-ai-box fs-ai-cam`} style={{ marginTop: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div className="fs-ai-box__tag" style={{ color: 'var(--charcoal)', fontWeight: 600 }}>
                                <span className="fs-ai-box__emoji">🔍</span> LATEST AI CAMERA VISION
                              </div>
                              <div className="fs-ai-box__result" style={{ fontSize: '0.9rem', color: 'var(--charcoal)' }}>
                                {selectedBatch.image_analysis.detection}
                              </div>
                              <div className="fs-ai-box__conf">
                                Confidence: {selectedBatch.image_analysis.confidence}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!selectedBatch.image_analysis && riskData.needs_scan && (
                        <div style={{ marginTop: '12px', padding: '8px', background: '#333', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          📸 <span><strong>Visual Scan Required:</strong> Anomalies detected in sensors. Please scan plant for visual confirmation.</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}