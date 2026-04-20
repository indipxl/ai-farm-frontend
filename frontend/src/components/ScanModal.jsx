import { useState, useRef } from 'react';
import { useImageAnalysis } from '../useImageAnalysis.js';
import AnnotatedImage from './AnnotatedImage';

export default function ScanModal({ batch, onClose, onSaveSuccess }) {
    const [phase, setPhase] = useState('upload');
    const [uploadedImage, setUploadedImage] = useState(null);
    const fileRef = useRef();

    const {
        uploadAnalyzeImage,
        createImageAnalysis,
        isAnalyzing,
        analysisResult: result,
        rawAnalysis,
        currentStep: step,
        isSaving: saving
    } = useImageAnalysis(batch?.id);

    const startProcessing = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setUploadedImage(imageUrl);
            setPhase('processing');
            uploadAnalyzeImage(file);
        }
    };

    const handleSave = async () => {
        if (rawAnalysis) {
            const success = await createImageAnalysis(rawAnalysis);
            if (success) {
                if (onSaveSuccess) onSaveSuccess();
                onClose();
            }
        }
    };

    if (!batch) return null;

    return (
        <div className="fs-modal-overlay" onClick={onClose}>
            <div className="fs-modal" onClick={e => e.stopPropagation()}>
                {(!result || phase === 'upload') && (
                    <div className="fs-camera-view">
                        <div className="fs-scan-frame-wrap">
                            <div className="fs-scan-frame">
                                {uploadedImage ? (
                                    <img src={uploadedImage} alt="Uploaded" className="fs-uploaded-image" style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '10px' }} />
                                ) : (
                                    <>
                                        <span className="fs-camera-view__bg">📷</span>
                                        <div className="fs-scan-frame-wrap">
                                            <div className="fs-scan-frame" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="fs-modal__header">
                    <div className="fs-modal__eyebrow">AI Camera Vision</div>
                    <div className="fs-modal__title">
                        Scanning: <span style={{ color: 'var(--gold-dim)' }}>{batch.crop}</span>
                    </div>
                    <div className="fs-modal__sub">{batch.id}</div>
                </div>
                <div className="fs-modal__body">
                    {phase === 'upload' && (
                        <>
                            <div className="fs-upload-drop" onClick={() => fileRef.current?.click()}>
                                <div style={{ fontSize: '1.5rem' }}>📁</div>
                                <div style={{ fontSize: '0.79rem', color: 'var(--text-dim)' }}>Upload photo</div>
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={startProcessing}
                            />
                            {/* <button className="fs-btn-upload" onClick={() => fileRef.current?.click()}>
                                📸 Upload Photo
                            </button> */}
                            <button className="fs-btn-cancel" onClick={onClose}>Cancel</button>
                        </>
                    )}
                    {isAnalyzing && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div className="fs-spinner" />
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '5px' }}>
                                Analysing...
                            </div>
                            <div className="fs-proc-step">{step}</div>
                        </div>
                    )}
                    {result && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <AnnotatedImage src={uploadedImage} boxes={rawAnalysis?.bounding_boxes || []} />
                            </div>
                            <div style={{ display: 'flex', gap: '11px', justifyContent: 'center', marginBottom: '14px', marginTop: '14px' }}>
                                <span style={{ fontSize: '1.9rem' }}>{result.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{result.title}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{result.conf}</div>
                                </div>
                            </div>
                            <div style={{ background: 'var(--cream2)', borderRadius: '10px', padding: '11px 13px', marginBottom: '12px', fontSize: '0.78rem' }}>
                                {result.detail}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '7px' }}>
                                Recommended Actions
                            </div>
                            {result.sugs.map((s, i) => (
                                <div key={i} className="fs-result-sug">{s}</div>
                            ))}
                            <button className="fs-btn-upload" style={{ marginTop: '10px' }} onClick={handleSave} disabled={saving}>
                                Save Image
                            </button>
                            <button className="fs-btn-cancel" onClick={onClose}>Cancel</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

