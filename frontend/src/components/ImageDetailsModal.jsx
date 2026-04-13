import React from 'react';

export default function ImageDetailsModal({ analysis, onClose }) {
    if (!analysis) return null;

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIcon = (status) => {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '🔍';
            case 'danger': return '⚠️';
            default: return '❓';
        }
    };

    const getConfLabel = (confidence) => `Confidence: ${confidence}%`;

    return (
        <div className="fs-modal-overlay" onClick={onClose}>
            <div className="fs-modal" onClick={e => e.stopPropagation()}>
                <div className="fs-camera-view">
                    <div className="fs-scan-frame-wrap">
                        <div className="fs-scan-frame">
                            {analysis.image_base64 ? (
                                <img src={analysis.image_base64} alt="Scan result" style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '10px' }} />
                            ) : (
                                <>
                                    <span className="fs-camera-view__bg">📷</span>
                                    <div className="fs-scan-frame-wrap"></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="fs-modal__header">
                    <div className="fs-modal__eyebrow">AI Analysis Report</div>
                    <div className="fs-modal__title">{analysis.detection || 'Analysis Results'}</div>
                    <div className="fs-modal__sub">
                        {formatTimestamp(analysis.timestamp)} · Batch {analysis.batch_id}
                    </div>
                </div>
                <div className="fs-modal__body">
                    <div style={{ display: 'flex', gap: '11px', alignItems: 'center', marginBottom: '14px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.9rem' }}>{getIcon(analysis.status)}</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                                {analysis.status ? analysis.status.toUpperCase() : 'ANALYSIS'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                                {getConfLabel(analysis.confidence)}
                            </div>
                        </div>
                    </div>
                    {analysis.detail && (
                        <div style={{ background: 'var(--cream2)', borderRadius: '10px', padding: '11px 13px', marginBottom: '12px', fontSize: '0.78rem' }}>
                            {analysis.detail}
                        </div>
                    )}
                    {analysis.suggestions && analysis.suggestions.length > 0 && (
                        <div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '7px' }}>
                                Recommended Actions
                            </div>
                            {analysis.suggestions.map((sug, i) => (
                                <div key={i} className="fs-result-sug">
                                    {sug}
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="fs-btn-cancel" onClick={onClose} style={{ padding: '8px 16px' }}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

