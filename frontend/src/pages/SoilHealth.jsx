import React, { useState } from 'react';
import { useBatches } from '../useBatches';
import { useFarmSettings } from '../useFarmSettings';

export default function SoilHealthPage() {
    const { batches, loading, error } = useBatches();
    const [activeMetric, setActiveMetric] = useState('moisture');

    const { settings, loading: settingsLoading } = useFarmSettings();

    if (loading || settingsLoading) return <div className="fs-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="fs-spinner"></div></div>;
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
    const trendText = "+5%";
    const trendMeta = "Soil Health vs Last Week";

    // 3. Primary Farm-Wide Deficit
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

    // Dynamic Heatmap config
    const blocks = settings?.blocks || [];
    const maxRow = blocks.length > 0 ? Math.max(...blocks.map(b => b.row)) : 0;
    const maxCol = blocks.length > 0 ? Math.max(...blocks.map(b => b.col)) : 0;

    const gridRows = maxRow + 1;
    const gridCols = maxCol + 1;
    const rows = Array.from({ length: gridRows }, (_, i) => i);
    const cols = Array.from({ length: gridCols }, (_, i) => i);

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
            const pct = Math.max(0, Math.min(100, val));
            hue = 50 + (pct / 100) * 170;
        } else if (metric === 'temperature') {
            const pct = Math.max(0, Math.min(100, ((val - 15) / 20) * 100));
            hue = 220 - (pct / 100) * 220;
        } else if (metric === 'ph') {
            if (val < 6.0) hue = 50;
            else if (val <= 7.2) hue = 120;
            else hue = 200;
        } else if (metric === 'n') {
            hue = 0; // Red
            saturation = 70;
            lightness = 90 - (Math.min(val, 200) / 200) * 50; // Darkens as N increases
        } else if (metric === 'p') {
            hue = 45; // Gold
            saturation = 80;
            lightness = 90 - (Math.min(val, 100) / 100) * 50; // Darkens as P increases
        } else if (metric === 'k') {
            hue = 120; // Green
            saturation = 60;
            lightness = 90 - (Math.min(val, 200) / 200) * 50; // Darkens as K increases
        } else {
            return '#333';
        }
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    return (
        <>
            <div className="fs-page-header">
                <div>
                    {/* <div className="fs-page-eyebrow">Farm-Wide Analytics · Synced Now</div> */}
                    <h1 className="fs-page-title">Soil <em>Monitor</em></h1>
                    {/* <p className="fs-page-sub">Global macro-level environment metrics and mapping</p> */}
                </div>
            </div>

            <div className="fs-stat-strip">
                <div className="fs-stat-card fs-stat-card--red">
                    <div className="fs-stat-card__label">Interventions Needed</div>
                    <div className={`fs-stat-card__val ${criticalBlocks.length > 0 ? "fs-stat-card__val--danger" : ""}`}>
                        {criticalBlocks.length}
                    </div>
                    <div className="fs-stat-card__meta">{interventionMeta}</div>
                    <span className={`fs-stat-tag ${criticalBlocks.length > 0 ? "fs-stat-tag--danger" : "fs-stat-tag--good"}`}>
                        {criticalBlocks.length > 0 ? "Action Required" : "All Clear"}
                    </span>
                </div>

                {/* <div className="fs-stat-card fs-stat-card--blue">
                    <div className="fs-stat-card__label">7-Day Health Trend</div>
                    <div className="fs-stat-card__val fs-stat-card__val--blue">{trendText}</div>
                    <div className="fs-stat-card__meta">{trendMeta}</div>
                    <span className="fs-stat-tag fs-stat-tag--blue">Improving</span>
                </div> */}

                <div className="fs-stat-card fs-stat-card--amber">
                    {/* <div className="fs-stat-card__label">Primary Deficit</div> */}
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

            <div style={{ marginTop: '2rem' }}>
                {/* Heatmap Section */}
                <div className="fs-card">
                    <div className="fs-card__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                        <div>
                            <div className="fs-card__title">Heatmap</div>
                            <div className="fs-card__sub">Topographic visualization of physical farm plots</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', background: 'var(--cream2)', padding: '4px', borderRadius: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                            <button
                                className={`fs-btn fs-btn--sm ${activeMetric === 'n' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                                style={activeMetric !== 'n' ? { border: 'none', color: 'var(--red)' } : {}}
                                onClick={() => setActiveMetric('n')}>N</button>
                            <button
                                className={`fs-btn fs-btn--sm ${activeMetric === 'p' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                                style={activeMetric !== 'p' ? { border: 'none', color: 'var(--gold)' } : {}}
                                onClick={() => setActiveMetric('p')}>P</button>
                            <button
                                className={`fs-btn fs-btn--sm ${activeMetric === 'k' ? 'fs-btn--primary' : 'fs-btn--ghost'}`}
                                style={activeMetric !== 'k' ? { border: 'none', color: 'var(--green)' } : {}}
                                onClick={() => setActiveMetric('k')}>K</button>
                        </div>
                    </div>
                    <div className="fs-card__body">
                        {blocks.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <p>No blocks configured. Please set up your layout in Farm Layout.</p>
                            </div>
                        ) : (
                            <div className="fs-heatmap-grid" style={{
                                gridTemplateColumns: `repeat(${gridCols}, minmax(40px, 1fr))`,
                                gridTemplateRows: `repeat(${gridRows}, minmax(40px, 1fr))`
                            }}>
                                {rows.map(r => (
                                    cols.map(c => {
                                        const block = blocks.find(b => b.row === r && b.col === c);

                                        if (block) {
                                            const batch = getBatchForLocation(block.label);
                                            let sensorVal = null;

                                            if (batch?.sensor_data?.soil) {
                                                if (activeMetric === 'moisture') sensorVal = batch.sensor_data.soil.moisture;
                                                if (activeMetric === 'temperature') sensorVal = batch.sensor_data.soil.temp;
                                                if (activeMetric === 'ph') sensorVal = batch.sensor_data.soil.ph;
                                                if (activeMetric === 'n') sensorVal = batch.sensor_data.soil.est_n;
                                                if (activeMetric === 'p') sensorVal = batch.sensor_data.soil.est_p;
                                                if (activeMetric === 'k') sensorVal = batch.sensor_data.soil.est_k;
                                            }

                                            const bgColor = getHeatmapColor(sensorVal, activeMetric);

                                            return (
                                                <div key={`${r}-${c}`} className="fs-heatmap-cell" style={{ background: bgColor, border: '1px solid var(--border)', minHeight: '60px' }} title={batch ? `${batch.crop}: ${sensorVal || 'N/A'}` : 'Empty'}>
                                                    {sensorVal !== null && <div className="fs-heatmap-cell__label" style={{ color: 'var(--charcoal)', fontWeight: 'bold' }}>{Math.round(sensorVal)}</div>}
                                                    {sensorVal === null && <div className="fs-heatmap-cell__label" style={{ opacity: 0.3, color: 'var(--charcoal)' }}>-</div>}
                                                </div>
                                            );
                                        } else {
                                            return <div key={`${r}-${c}`} className="fs-heatmap-cell" style={{ background: 'transparent' }} />;
                                        }
                                    })
                                ))}
                            </div>
                        )}
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
                            {activeMetric === 'n' && <>
                                <span className="fs-heatmap-legend__label">Low N</span>
                                <div className="fs-heatmap-legend__bar" style={{ background: 'linear-gradient(90deg, hsl(0, 70%, 90%), hsl(0, 70%, 40%))' }}></div>
                                <span className="fs-heatmap-legend__label">High N</span>
                            </>}
                            {activeMetric === 'p' && <>
                                <span className="fs-heatmap-legend__label">Low P</span>
                                <div className="fs-heatmap-legend__bar" style={{ background: 'linear-gradient(90deg, hsl(45, 80%, 90%), hsl(45, 80%, 40%))' }}></div>
                                <span className="fs-heatmap-legend__label">High P</span>
                            </>}
                            {activeMetric === 'k' && <>
                                <span className="fs-heatmap-legend__label">Low K</span>
                                <div className="fs-heatmap-legend__bar" style={{ background: 'linear-gradient(90deg, hsl(120, 60%, 90%), hsl(120, 60%, 40%))' }}></div>
                                <span className="fs-heatmap-legend__label">High K</span>
                            </>}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}