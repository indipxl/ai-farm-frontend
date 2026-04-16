import React, { useState } from 'react';
import '../farmsense.css';

export default function FieldMap({ batches }) {
    const [selectedBatch, setSelectedBatch] = useState(null);
    // Generate the 24 blocks: A1 to D6
    const blocksRow = ['A', 'B', 'C', 'D'];
    const blocksCol = [1, 2, 3, 4, 5, 6];

    // Helper to find if a batch is located in a specific plotted block
    const getBatchForLocation = (locName) => {
        if (!batches) return null;
        return batches.find(b => {
            const loc = b.location ? b.location.trim().toUpperCase() : '';
            // Ensure "BLOCK D" falls back to "BLOCK D1" on the visual map so legacy batches appear
            return loc === locName.toUpperCase() || (loc === locName.slice(0, -1).trim() && locName.endsWith('1'));
        });
    };

    // Color definitions to make text pop
    const statusColors = {
        healthy: 'var(--green)',
        warning: 'var(--amber)',
        danger: 'var(--red)'
    };

    const statusLabel = { healthy: "Healthy", warning: "Warning", danger: "Danger" };
    const pillCls = { healthy: "fs-pill--healthy", warning: "fs-pill--warning", danger: "fs-pill--danger" };

    return (
        <>
            <div className="fs-grid-2">
                <div className="fs-card" style={{ marginBottom: '28px' }}>
                    <div className="fs-card__header">
                        <div>
                            <div className="fs-card__title">Farm Field Map</div>
                            <div className="fs-card__sub">Live physical mapping of active batches from Block A1 to D6</div>
                        </div>
                    </div>
                    <div className="fs-card__body">
                        <div className="fs-farm-map">
                            <div className="fs-map-grid">
                                {blocksRow.map(row => (
                                    blocksCol.map(col => {
                                        const locString = `BLOCK ${row}${col}`;
                                        const batch = getBatchForLocation(locString);

                                        if (batch) {
                                            let statusClass = 'fs-map-block--healthy';
                                            if (batch.status === 'danger') statusClass = 'fs-map-block--danger';
                                            else if (batch.status === 'warning') statusClass = 'fs-map-block--warning';

                                            return (
                                                <div
                                                    key={locString}
                                                    className={`fs-map-block ${statusClass} fs-map-block--active`}
                                                    title={`Active: ${batch.crop}`}
                                                    onClick={() => setSelectedBatch(batch)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="fs-map-block__label" style={{ color: statusColors[batch.status] || 'var(--charcoal)' }}>{locString}</div>
                                                    <div className="fs-map-block__crop" style={{ filter: batch.status === 'danger' ? 'hue-rotate(-50deg)' : 'none' }}>🌱</div>
                                                    <div className="fs-map-block__status" style={{ textAlign: 'center', fontWeight: '900', color: statusColors[batch.status] || 'var(--charcoal)' }}>
                                                        {batch.crop.charAt(0).toUpperCase() + batch.crop.slice(1)}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={locString} className="fs-map-block fs-map-block--empty" title={`Empty Plot`}>
                                                    <div className="fs-map-block__label" style={{ opacity: 0.6 }}>{locString}</div>
                                                    <div className="fs-map-block__crop" style={{ opacity: 0.2 }}>-</div>
                                                    <div className="fs-map-block__status" style={{ textAlign: 'center', opacity: 0.6 }}>
                                                        Empty
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedBatch && (
                <div className="fs-modal-overlay" onClick={() => setSelectedBatch(null)} style={{ zIndex: 9999 }}>
                    <div className="fs-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
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
                            <div className="fs-sensor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
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
                                <div style={{ background: 'var(--cream2)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Soil Nutrients (NPK mg/kg)</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                                        <div style={{ color: 'var(--red)' }}>N: {selectedBatch.sensor_data.soil.est_n}</div>
                                        <div style={{ color: 'var(--gold)' }}>P: {selectedBatch.sensor_data.soil.est_p}</div>
                                        <div style={{ color: 'var(--green)' }}>K: {selectedBatch.sensor_data.soil.est_k}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
