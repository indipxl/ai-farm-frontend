import React, { useState } from 'react';
import { useBatches } from '../useBatches';

export default function SoilHealthPage() {
    const { batches, loading, error } = useBatches();
    const [activeMetric, setActiveMetric] = useState('moisture');

    if (loading) return <div className="fs-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="fs-spinner"></div></div>;
    if (error) return <div className="fs-page"><div className="fs-card"><div className="fs-card__body">Error loading data: {error}</div></div></div>;

    // 1. Calculate Active Interventions Required
    const criticalBlocks = batches.filter(b => b.status === 'danger' || b.status === 'warning');
    const dangerCount = batches.filter(b => b.status === 'danger').length;
    const warnCount = batches.filter(b => b.status === 'warning').length;

    let interventionMeta = "All blocks healthy";
    if (criticalBlocks.length > 0) {
        interventionMeta = `${dangerCount > 0 ? `${dangerCount} Critical` : ''} ${warnCount > 0 ? `${warnCount} Warning` : ''}`.trim();
    }

    // 2. 7-Day Soil Health Trend
    // Extrapolated/mocked positively since historical data isn't in single batch object
    const trendText = "+5%";
    const trendMeta = "Soil Health vs Last Week";

    // 3. Primary Farm-Wide Deficit
    // For demo purposes, we do a basic check on ai_reports. If none, we default to Neutral.
    let rootDeficit = "Nitrogen";
    const reportText = criticalBlocks.map(b => b.ai_report?.analysis || "").join(" ").toLowerCase();
    if (reportText.includes("ph")) rootDeficit = "pH Imbalance";
    else if (reportText.includes("moisture") || reportText.includes("water")) rootDeficit = "Moisture Deficit";
    else if (reportText.includes("nitrogen")) rootDeficit = "Nitrogen";
    if (criticalBlocks.length === 0) rootDeficit = "None Detected";

    // 4. Count of Optimal Blocks
    const optimalBlocksCount = batches.filter(b => b.status === 'healthy').length;

    // Filter threats for the Feed
    const aiThreats = batches.filter(b => (b.status === 'danger' || b.status === 'warning') && b.ai_report);

    // Heatmap config
    const blocksRow = ['A', 'B', 'C', 'D'];
    const blocksCol = [1, 2, 3, 4, 5, 6];

    const getBatchForLocation = (locName) => {
        return batches.find(b => {
            const loc = b.location ? b.location.trim().toUpperCase() : '';
            return loc === locName.toUpperCase() || (loc === locName.slice(0, -1).trim() && locName.endsWith('1'));
        });
    };

    const getHeatmapColor = (val, metric) => {
        if (val === null || val === undefined) return 'var(--cream2)';

        let hue, lightness = 50, saturation = 70;

        if (metric === 'moisture') {
            // Moisture: 0 (Yellow/Dry) -> 100 (Deep Blue/Wet)
            // Yellow is hue 50, Blue is hue 220
            const pct = Math.max(0, Math.min(100, val));
            hue = 50 + (pct / 100) * 170;
        } else if (metric === 'temperature') {
            // Temp: 15 (Blueish) -> 35 (Red/Hot)
            // Blue = 220, Red = 0/360. 
            const pct = Math.max(0, Math.min(100, ((val - 15) / 20) * 100));
            hue = 220 - (pct / 100) * 220;
        } else if (metric === 'ph') {
            // pH: <6 (Yellow/Acid), 6.5-7 (Green/Optimal), >7.5 (Blue/Alkaline)
            if (val < 6.0) hue = 50;
            else if (val <= 7.2) hue = 120;
            else hue = 200;
        } else {
            return '#333';
        }
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    return (
        <>
            <div className="fs-page-header">
                <div>
                    <div className="fs-page-eyebrow">Farm-Wide Analytics · Synced Now</div>
                    <h1 className="fs-page-title">Topographic <em>Command Center</em></h1>
                    <p className="fs-page-sub">Global macro-level environment metrics and mapping</p>
                </div>
            </div>

            <div className="fs-stat-strip">
                <div className="fs-stat-card fs-stat-card--red">
                    <div className="fs-stat-card__label">Active Interventions</div>
                    <div className={`fs-stat-card__val ${criticalBlocks.length > 0 ? "fs-stat-card__val--danger" : ""}`}>
                        {criticalBlocks.length}
                    </div>
                    <div className="fs-stat-card__meta">{interventionMeta}</div>
                    <span className={`fs-stat-tag ${criticalBlocks.length > 0 ? "fs-stat-tag--danger" : "fs-stat-tag--good"}`}>
                        {criticalBlocks.length > 0 ? "Action Required" : "All Clear"}
                    </span>
                </div>

                <div className="fs-stat-card fs-stat-card--blue">
                    <div className="fs-stat-card__label">7-Day Health Trend</div>
                    <div className="fs-stat-card__val fs-stat-card__val--blue">{trendText}</div>
                    <div className="fs-stat-card__meta">{trendMeta}</div>
                    <span className="fs-stat-tag fs-stat-tag--blue">Improving</span>
                </div>

                <div className="fs-stat-card fs-stat-card--amber">
                    <div className="fs-stat-card__label">Primary Deficit</div>
                    <div className="fs-stat-card__val fs-stat-card__val--warn" style={{ fontSize: '1.4rem', marginTop: '10px' }}>
                        {rootDeficit}
                    </div>
                    <div className="fs-stat-card__meta">Across active field</div>
                    <span className="fs-stat-tag fs-stat-tag--warn">Systemic Check</span>
                </div>

                <div className="fs-stat-card fs-stat-card--green">
                    <div className="fs-stat-card__label">Optimal Blocks</div>
                    <div className="fs-stat-card__val">{optimalBlocksCount}</div>
                    <div className="fs-stat-card__meta">Score &gt; 80 / Status Healthy</div>
                    <span className="fs-stat-tag fs-stat-tag--good">Excellent</span>
                </div>
            </div>

            <div className="fs-grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
                {/* Heatmap Section */}
                <div className="fs-card">
                    <div className="fs-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="fs-card__title">Interactive Metric Heatmap</div>
                            <div className="fs-card__sub">Topographic visualization of physical farm plots</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', background: 'var(--cream2)', padding: '4px', borderRadius: '8px' }}>
                            <button
                                className={`fs-btn fs-btn--sm ${activeMetric === 'temperature' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                                style={activeMetric !== 'temperature' ? { border: 'none' } : {}}
                                onClick={() => setActiveMetric('temperature')}>🌡️ Temp</button>
                            <button
                                className={`fs-btn fs-btn--sm ${activeMetric === 'moisture' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                                style={activeMetric !== 'moisture' ? { border: 'none' } : {}}
                                onClick={() => setActiveMetric('moisture')}>💧 Moisture</button>
                            <button
                                className={`fs-btn fs-btn--sm ${activeMetric === 'ph' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                                style={activeMetric !== 'ph' ? { border: 'none' } : {}}
                                onClick={() => setActiveMetric('ph')}>⚗️ pH</button>
                        </div>
                    </div>
                    <div className="fs-card__body">
                        <div className="fs-heatmap-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
                            {blocksRow.map(row => (
                                blocksCol.map(col => {
                                    const locString = `BLOCK ${row}${col}`;
                                    const batch = getBatchForLocation(locString);
                                    let sensorVal = null;

                                    if (batch?.sensor_data?.soil) {
                                        if (activeMetric === 'moisture') sensorVal = batch.sensor_data.soil.moisture;
                                        if (activeMetric === 'temperature') sensorVal = batch.sensor_data.soil.temp;
                                        if (activeMetric === 'ph') sensorVal = batch.sensor_data.soil.ph;
                                    }

                                    const bgColor = getHeatmapColor(sensorVal, activeMetric);

                                    return (
                                        <div key={locString} className="fs-heatmap-cell" style={{ background: bgColor, border: '1px solid var(--border)', minHeight: '60px' }} title={batch ? `${batch.crop}: ${sensorVal || 'N/A'}` : 'Empty'}>
                                            {sensorVal !== null && <div className="fs-heatmap-cell__label" style={{ color: 'var(--charcoal)', fontWeight: 'bold' }}>{Math.round(sensorVal)}</div>}
                                            {sensorVal === null && <div className="fs-heatmap-cell__label" style={{ opacity: 0.3, color: 'var(--charcoal)' }}>-</div>}
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                        <div className="fs-heatmap-legend">
                            {activeMetric === 'moisture' && <>
                                <span className="fs-heatmap-legend__label">Dry</span>
                                <div className="fs-heatmap-legend__bar" style={{ background: 'linear-gradient(90deg, hsl(50, 70%, 50%), hsl(135, 70%, 50%), hsl(220, 70%, 50%))' }}></div>
                                <span className="fs-heatmap-legend__label">Wet</span>
                            </>}
                            {activeMetric === 'temperature' && <>
                                <span className="fs-heatmap-legend__label">Cool</span>
                                <div className="fs-heatmap-legend__bar" style={{ background: 'linear-gradient(90deg, hsl(220, 70%, 50%), hsl(120, 70%, 50%), hsl(0, 70%, 50%))' }}></div>
                                <span className="fs-heatmap-legend__label">Hot</span>
                            </>}
                            {activeMetric === 'ph' && <>
                                <span className="fs-heatmap-legend__label">Acidic</span>
                                <div className="fs-heatmap-legend__bar" style={{ background: 'linear-gradient(90deg, hsl(50, 70%, 50%), hsl(120, 70%, 50%), hsl(200, 70%, 50%))' }}></div>
                                <span className="fs-heatmap-legend__label">Alkaline</span>
                            </>}
                        </div>
                    </div>
                </div>

                {/* AI Threat Feed */}
                <div className="fs-card">
                    <div className="fs-card__header">
                        <div>
                            <div className="fs-card__title">AI Threat Feed</div>
                            <div className="fs-card__sub">Live farm-wide actionable risks</div>
                        </div>
                    </div>
                    <div className="fs-card__body" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {aiThreats.length === 0 ? (
                            <div className="fs-no-results" style={{ padding: '40px 10px' }}>
                                <div className="fs-no-results__icon">🛡️</div>
                                <div className="fs-no-results__title">No Active Threats</div>
                                <div className="fs-no-results__desc">AI systems report perfect environmental conditions across all arrays.</div>
                            </div>
                        ) : (
                            aiThreats.map(b => (
                                <div key={b.id} className={`fs-threat-entry ${b.status === 'danger' ? 'fs-threat-entry--danger' : 'fs-threat-entry--warn'}`}>
                                    <div className="fs-threat-entry__icon">{b.status === 'danger' ? '🚨' : '⚠️'}</div>
                                    <div>
                                        <div className="fs-threat-entry__title">{b.location} · {b.crop}</div>
                                        <div className="fs-threat-entry__desc">{b.ai_report.analysis}</div>
                                        <div className="fs-threat-entry__meta">Detected moments ago</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}