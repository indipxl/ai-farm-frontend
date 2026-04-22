import React, { useState } from 'react';
import { format } from 'date-fns';
import '../farmsense.css';
import { useFarmSettings } from '../useFarmSettings';

export default function FieldMap({ batches, editMode = false }) {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const { settings, updateSettings, loading } = useFarmSettings();

    if (loading) {
        return <div className="fs-card" style={{ marginBottom: '28px', padding: '24px' }}>Loading map configuration...</div>;
    }

    const blocks = settings?.blocks || [];

    // Helper to find if a batch is located in a specific plotted block
    const getBatchForLocation = (locName) => {
        if (!batches) return null;
        return batches.find(b => {
            const loc = b.location ? b.location.trim().toUpperCase() : '';
            return loc === locName.toUpperCase() || (loc === locName.slice(0, -1).trim() && locName.endsWith('1'));
        });
    };

    // Calculate dynamic grid bounds
    const maxRow = blocks.length > 0 ? Math.max(...blocks.map(b => b.row)) : 0;
    const maxCol = blocks.length > 0 ? Math.max(...blocks.map(b => b.col)) : 0;

    // Render from 0 to max + 1 to show + signs around if editMode is true
    const gridRows = maxRow + (editMode ? 2 : 1);
    const gridCols = maxCol + (editMode ? 2 : 1);
    const rows = Array.from({ length: gridRows }, (_, i) => i);
    const cols = Array.from({ length: gridCols }, (_, i) => i);

    const hasBlock = (r, c) => blocks.some(b => b.row === r && b.col === c);
    const isAdjacent = (r, c) => {
        return hasBlock(r - 1, c) || hasBlock(r + 1, c) || hasBlock(r, c - 1) || hasBlock(r, c + 1);
    };

    const handleAddBlock = async (r, c) => {
        if (!editMode) return;
        const rowsChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const rChar = rowsChars[r] || "Z";
        const newId = `${rChar}${c + 1}`;
        const newBlock = { id: newId, row: r, col: c, label: `BLOCK ${newId}` };

        await updateSettings({
            ...settings,
            num_blocks: (settings.num_blocks || blocks.length) + 1,
            blocks: [...blocks, newBlock]
        });
    };

    const handleDeleteBlock = async (block, e) => {
        if (!editMode) return;
        e.stopPropagation();
        // Prevent deleting if a batch is using it
        const batch = getBatchForLocation(block.label);
        if (batch) {
            alert(`Cannot delete ${block.label} because it has an active batch.`);
            return;
        }

        const newBlocks = blocks.filter(b => b.id !== block.id);
        await updateSettings({
            ...settings,
            num_blocks: newBlocks.length,
            blocks: newBlocks
        });
    };

    // Color definitions to make text pop
    const statusColors = {
        healthy: 'var(--green)',
        warning: 'var(--amber)',
        danger: 'var(--red)'
    };

    const statusLabel = { healthy: "Healthy", warning: "Warning", danger: "Danger" };
    const aiBoxCls = { healthy: "", warning: "fs-ai-box--warn", danger: "fs-ai-box--alert" };
    const cardCls = { healthy: "", warning: "fs-batch-card--warn", danger: "fs-batch-card--danger" };
    const barCls = { healthy: "fs-batch-card__bar--healthy", warning: "fs-batch-card__bar--warning", danger: "fs-batch-card__bar--danger" };
    const pillCls = { healthy: "fs-pill--healthy", warning: "fs-pill--warning", danger: "fs-pill--danger" };

    const formatBatchDate = (dateString) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "MMM d, yyyy");
    };

    return (
        <>
            <div className="fs-grid-2">
                <div className="fs-card" style={{ marginBottom: '28px' }}>
                    <div className="fs-card__header">
                        <div>
                            <div className="fs-card__title">Farm Field Map</div>
                            <div className="fs-card__sub">{editMode ? "Interactive layout editor. Click + to add blocks." : "Live physical mapping of active batches."}</div>
                        </div>
                    </div>
                    <div className="fs-card__body">
                        <div className="fs-farm-map" style={{ overflowX: 'auto' }}>
                            {blocks.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                    <p>No blocks configured.</p>
                                    {editMode && (
                                        <button
                                            onClick={() => handleAddBlock(0, 0)}
                                            style={{ padding: '0.5rem 1rem', background: 'var(--charcoal)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                                            + Add First Block (A1)
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="fs-map-grid" style={{
                                    gridTemplateColumns: `repeat(${gridCols}, minmax(80px, 1fr))`,
                                    gridTemplateRows: `repeat(${gridRows}, minmax(80px, 1fr))`
                                }}>
                                    {rows.map(r => (
                                        cols.map(c => {
                                            const block = blocks.find(b => b.row === r && b.col === c);

                                            if (block) {
                                                const batch = getBatchForLocation(block.label);
                                                if (batch) {
                                                    let statusClass = 'fs-map-block--healthy';
                                                    if (batch.status === 'danger') statusClass = 'fs-map-block--danger';
                                                    else if (batch.status === 'warning') statusClass = 'fs-map-block--warning';

                                                    return (
                                                        <div
                                                            key={`${r}-${c}`}
                                                            className={`fs-map-block ${statusClass} fs-map-block--active`}
                                                            title={`Active: ${batch.crop}`}
                                                            onClick={() => !editMode && setSelectedBatch(batch)}
                                                            style={{ cursor: editMode ? 'default' : 'pointer', position: 'relative' }}
                                                        >
                                                            <div className="fs-map-block__label" style={{ color: statusColors[batch.status] || 'var(--charcoal)' }}>{block.label}</div>
                                                            <div className="fs-map-block__crop" style={{ filter: batch.status === 'danger' ? 'hue-rotate(-50deg)' : 'none' }}>
                                                                {batch.crop.toLowerCase().includes('chilli') ? '🌶️' : '🌿'}
                                                            </div>
                                                            <div className="fs-map-block__status" style={{ textAlign: 'center', fontWeight: '900', color: statusColors[batch.status] || 'var(--charcoal)' }}>
                                                                {batch.crop.charAt(0).toUpperCase() + batch.crop.slice(1)}
                                                            </div>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div key={`${r}-${c}`} className="fs-map-block fs-map-block--empty" title={`Empty Plot`} style={{ position: 'relative' }}>
                                                            {editMode && (
                                                                <button
                                                                    onClick={(e) => handleDeleteBlock(block, e)}
                                                                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '2.5rem', zIndex: 10 }}
                                                                    title="Delete Block"
                                                                >
                                                                    &times;
                                                                </button>
                                                            )}
                                                            <div className="fs-map-block__label" style={{ opacity: 0.6 }}>{block.label}</div>
                                                            <div className="fs-map-block__crop" style={{ opacity: 0.2 }}>-</div>
                                                        </div>
                                                    );
                                                }
                                            } else if (editMode && isAdjacent(r, c)) {
                                                // Render an add button
                                                return (
                                                    <div
                                                        key={`${r}-${c}`}
                                                        className="fs-map-block fs-map-block--empty"
                                                        onClick={() => handleAddBlock(r, c)}
                                                        style={{ cursor: 'pointer', border: '2px dashed var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Add Block"
                                                    >
                                                        <span style={{ fontSize: '2rem', color: 'var(--border)', fontWeight: 300 }}>+</span>
                                                    </div>
                                                );
                                            } else {
                                                // Render empty spacer
                                                return <div key={`${r}-${c}`} />;
                                            }
                                        })
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedBatch && (
                <div className="fs-modal-overlay" onClick={() => setSelectedBatch(null)} style={{ zIndex: 9999 }}>
                    <div className="fs-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: 0, overflowY: 'auto', maxHeight: '90vh', background: 'transparent', boxShadow: 'none' }}>
                        <div className={`fs-batch-card ${cardCls[selectedBatch.status]} m-0`} style={{ margin: 0, width: '100%', animationDelay: '0s' }}>
                            <div className={`fs-batch-card__bar ${barCls[selectedBatch.status]}`} />
                            <div className="fs-batch-card__header">
                                <div style={{ flex: 1 }}>
                                    <div className="fs-batch-card__crop">{selectedBatch.crop}</div>
                                    <div className="fs-batch-card__loc">📍 {selectedBatch.location}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <div className="fs-batch-card__id">{selectedBatch.id} · Planted on {formatBatchDate(selectedBatch.created_at)}</div>
                                    </div>
                                </div>
                                <span className={`fs-pill ${pillCls[selectedBatch.status]}`} style={{ fontSize: '0.65rem', padding: '1px 8px' }}>
                                    {statusLabel[selectedBatch.status]}
                                </span>
                            </div>
                            <div className="fs-batch-card__body">
                                <div className="fs-sensor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div className="fs-sensor-mini">
                                        <span className="fs-sensor-mini__icon">🌡️</span>
                                        <span className="fs-sensor-mini__name">Air Temp</span>
                                        <span className={`fs-sensor-mini__val`}>{selectedBatch.sensor_data?.air?.temp ?? '--'}°C</span>
                                    </div>
                                    <div className="fs-sensor-mini">
                                        <span className="fs-sensor-mini__icon">🌤️</span>
                                        <span className="fs-sensor-mini__name">Humidity</span>
                                        <span className="fs-sensor-mini__val">{selectedBatch.sensor_data?.air?.hum ?? '--'}%</span>
                                    </div>
                                    <div className="fs-sensor-mini">
                                        <span className="fs-sensor-mini__icon">🌱</span>
                                        <span className="fs-sensor-mini__name">Soil Temp</span>
                                        <span className={`fs-sensor-mini__val`}>{selectedBatch.sensor_data?.soil?.temp ?? '--'}°C</span>
                                    </div>
                                    <div className="fs-sensor-mini">
                                        <span className="fs-sensor-mini__icon">💧</span>
                                        <span className="fs-sensor-mini__name">Moisture</span>
                                        <span className={`fs-sensor-mini__val`}>{selectedBatch.sensor_data?.soil?.moisture ?? '--'}%</span>
                                    </div>
                                    <div className="fs-sensor-mini">
                                        <span className="fs-sensor-mini__icon">⚗️</span>
                                        <span className="fs-sensor-mini__name">pH</span>
                                        <span className={`fs-sensor-mini__val`}>{selectedBatch.sensor_data?.soil?.ph ?? '--'}</span>
                                    </div>
                                    <div className="fs-sensor-mini">
                                        <span className="fs-sensor-mini__icon">⚡</span>
                                        <span className="fs-sensor-mini__name">Soil EC</span>
                                        <span className={`fs-sensor-mini__val`}>{selectedBatch.sensor_data?.soil?.ec ?? '--'} dS/m</span>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--cream2)', borderRadius: '8px', padding: '12px', marginTop: '8px', marginBottom: '12px' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Est. Soil Nutrients (mg/kg)</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem' }}>
                                        <div style={{ color: 'var(--red)' }}>N: {selectedBatch.sensor_data?.soil?.est_n ?? '--'}</div>
                                        <div style={{ color: 'var(--gold)' }}>P: {selectedBatch.sensor_data?.soil?.est_p ?? '--'}</div>
                                        <div style={{ color: 'var(--green)' }}>K: {selectedBatch.sensor_data?.soil?.est_k ?? '--'}</div>
                                    </div>
                                </div>
                                <div className={`fs-ai-box ${aiBoxCls[selectedBatch.status]} fs-ai-cam`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1, opacity: selectedBatch.image_analysis ? 1 : 0.6 }}>
                                            <div className="fs-ai-box__tag"><span className="fs-ai-box__emoji">🔍</span> AI Camera Vision</div>
                                            <div className="fs-ai-box__result">{selectedBatch.image_analysis?.detection ?? 'No Scan Data'}</div>
                                            <div className="fs-ai-box__conf">{selectedBatch.image_analysis ? `Confidence: ${selectedBatch.image_analysis.confidence}%` : '--'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="fs-suggestion">
                                    <div className="fs-suggestion__label">AI Recommendation</div>
                                    {selectedBatch.ai_report?.analysis ?? 'No analysis available.'}
                                </div>
                                <div className="fs-batch-card__last-scan">Last scan: {selectedBatch.image_analysis?.timestamp ? format(new Date(selectedBatch.image_analysis.timestamp), "d MMMM yyyy hh:mm:ss a") : 'No scans yet'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
