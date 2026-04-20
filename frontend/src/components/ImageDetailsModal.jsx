import React, { useState, useEffect } from 'react';
import AnnotatedImage from './AnnotatedImage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ImageDetailsModal({ analysis, onClose }) {
    const [dynamicBoxes, setDynamicBoxes] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (analysis && analysis.image_base64 && typeof analysis.bounding_boxes === 'undefined') {
            const fetchYoloBoxes = async () => {
                setIsAnalyzing(true);
                try {
                    const res = await fetch(analysis.image_base64);
                    const blob = await res.blob();
                    const file = new File([blob], "image.jpg", { type: "image/jpeg" });

                    const formData = new FormData();
                    formData.append('file', file);
                    if (analysis.batch_id) {
                        formData.append('batch_id', analysis.batch_id);
                    }

                    const response = await fetch(`${API_BASE_URL}/api/image/upload-image-analysis`, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data && typeof data.bounding_boxes !== 'undefined') {
                            setDynamicBoxes(data.bounding_boxes);
                        }
                    }
                } catch (e) {
                    console.error("Failed to dynamically fetch YOLO boxes:", e);
                } finally {
                    setIsAnalyzing(false);
                }
            };
            fetchYoloBoxes();
        }
    }, [analysis]);

    if (!analysis) return null;

    const displayBoxes = dynamicBoxes || analysis.bounding_boxes || [];
    const hasBoxes = displayBoxes.length > 0;

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

                <div className="fs-modal__header">
                    <div className="fs-modal__eyebrow">AI Analysis Report</div>
                    <div className="fs-modal__title">{analysis.detection || 'Analysis Results'}</div>
                    <div className="fs-modal__sub">
                        {formatTimestamp(analysis.timestamp)} · Batch {analysis.batch_id}
                    </div>
                </div>
                <div className="fs-modal__body">
                    {analysis.image_base64 && (
                        <div style={{ position: 'relative' }}>
                            <AnnotatedImage src={analysis.image_base64} boxes={displayBoxes} />
                            {isAnalyzing && (
                                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(28,28,26,0.75)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                    ⏳ Generating YOLO Vision...
                                </div>
                            )}
                        </div>
                    )}
                    {!hasBoxes && !isAnalyzing && (
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
                    )}
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
