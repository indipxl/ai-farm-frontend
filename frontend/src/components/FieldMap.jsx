import React from 'react';
import '../farmsense.css';

export default function FieldMap({ batches }) {
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

    return (
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
                                        <div key={locString} className={`fs-map-block ${statusClass}`} title={`Active: ${batch.crop}`}>
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
    );
}
