import { useState, useEffect } from "react";
import { useBatches } from "../useBatches.js";
import ScanModal from "../components/ScanModal";
import AnnotatedImage from "../components/AnnotatedImage";
import QRModal from "../components/QRModal";
import RegisterBatchModal from "../components/RegisterBatchModal";
import EditBatchModal from "../components/EditBatchModal";
import DeleteBatchModal from "../components/DeleteBatchModal";
import ImageDetailsModal from "../components/ImageDetailsModal";
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import "../farmsense.css";

export default function BatchProfilesPage() {
    const { batches, addBatch, updateBatch, deleteBatch, refetch, analyzeBatch, analyzeAllBatches } = useBatches();
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [scanBatch, setScanBatch] = useState(null);
    const [qrBatch, setQrBatch] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [newBatchForm, setNewBatchForm] = useState({ crop: "", location: "", notes: "" });
    const [submitting, setSubmitting] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [analyzingBatchId, setAnalyzingBatchId] = useState(null);
    const [analyzingAll, setAnalyzingAll] = useState(false);

    // Edit and Delete states
    const [editBatch, setEditBatch] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleteBatchId, setDeleteBatchId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleOpenModal = () => setShowRegisterModal(true);

    const handleCloseModal = () => {
        setShowRegisterModal(false);
        setNewBatchForm({ crop: "", location: "", notes: "" });
    };

    const handleFormChange = (e) => {
        setNewBatchForm({ ...newBatchForm, [e.target.name]: e.target.value });
    };

    const handleSubmitBatch = async (formData) => {
        setSubmitting(true);
        try {
            await addBatch(formData);
            toast.success(`Registered ${formData.crop}!`);
            handleCloseModal();
        } catch (err) {
            if (err.message && err.message.includes('occupied')) {
                toast.error("That location is already occupied!");
            } else {
                toast.error("Failed to register batch.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmission = async (docId, formData) => {
        try {
            await updateBatch(docId, formData);
            setShowEditModal(false);
            setEditBatch(null);
        } catch {
            throw new Error("Update failed");
        }
    };

    const handleDeleteSubmission = async (docId) => {
        try {
            await deleteBatch(docId);
            setShowDeleteModal(false);
            setDeleteBatchId(null);
        } catch {
            throw new Error("Failed to delete batch");
        }
    };

    const handleAnalyzeBatch = async (batchId) => {
        setAnalyzingBatchId(batchId);
        try {
            await analyzeBatch(batchId);
            toast.success("AI Analysis complete!");
        } catch (e) {
            toast.error("AI Analysis failed.");
        } finally {
            setAnalyzingBatchId(null);
        }
    };

    const handleAnalyzeAll = async () => {
        setAnalyzingAll(true);
        toast.loading("Running analysis on all batches...", { id: 'analyzeAll' });
        try {
            const res = await analyzeAllBatches();
            toast.success(`Analysis complete! Processed ${res.processed} batches.`, { id: 'analyzeAll' });
        } catch (e) {
            toast.error("Failed to analyze all batches.", { id: 'analyzeAll' });
        } finally {
            setAnalyzingAll(false);
        }
    };

    const alertCount = (batches || []).filter((b) => b.status !== "healthy").length;

    const filtered = (batches || []).filter(b => {
        // Search filter - check both crop and id
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const cropMatch = b.crop.toLowerCase().includes(query);
            const idMatch = b.id.toLowerCase().includes(query);
            if (!cropMatch && !idMatch) return false;
        }
        if (filter === "Alerts") return b.status !== "healthy";
        if (filter === "Healthy") return b.status === "healthy";
        return true;
    });

    const statusLabel = { healthy: "Healthy", warning: "Warning", danger: "Danger" };
    const aiBoxCls = { healthy: "", warning: "fs-ai-box--warn", danger: "fs-ai-box--alert" };
    const cardCls = { healthy: "", warning: "fs-batch-card--warn", danger: "fs-batch-card--danger" };
    const barCls = { healthy: "fs-batch-card__bar--healthy", warning: "fs-batch-card__bar--warning", danger: "fs-batch-card__bar--danger" };
    const pillCls = { healthy: "fs-pill--healthy", warning: "fs-pill--warning", danger: "fs-pill--danger" };

    const formatBatchDate = (dateString) => {
        if (!dateString) return "N/A";

        const date = new Date(dateString);

        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    return (
        <>
            <div className="fs-page-header">
                <div>
                    <h1 className="fs-page-title">Batch <em>Profiles</em></h1>
                    <p className="fs-page-sub">Monitoring {(batches || []).length} active batches</p>
                </div>
            </div>

            <div className="fs-stat-strip">
                <div className="fs-stat-card fs-stat-card--gold">
                    <div className="fs-stat-card__label">Active Batches</div>
                    <div className="fs-stat-card__val">{(batches || []).length}</div>
                </div>
                <div className="fs-stat-card fs-stat-card--red">
                    <div className="fs-stat-card__label">Alerts</div>
                    <div className="fs-stat-card__val fs-stat-card__val--danger">
                        {alertCount}
                    </div>
                </div>
            </div>

            <div className="fs-section-row">
                <div className="fs-section-label">Registered Batches</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="fs-btn fs-btn--ghost fs-btn--sm"
                        onClick={handleAnalyzeAll}
                        disabled={analyzingAll}
                        style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                    >
                        {analyzingAll ? '✨ Analyzing...' : '✨ Run AI Analysis'}
                    </button>
                    <button className="fs-btn fs-btn--gold fs-btn--sm" onClick={handleOpenModal}>
                        + Create Batch
                    </button>
                </div>
            </div>

            <div className="fs-section-row2">
                <div className="fs-search-group">
                    <input
                        type="text"
                        className="fs-search-input"
                        placeholder="Search crop name or batch ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="fs-filter-group">
                    {["All", "Alerts", "Healthy"].map((f) => (
                        <button
                            key={f}
                            className={`fs-filter-pill ${filter === f ? "fs-filter-pill--active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="fs-batch-grid">
                {filtered.map((b, i) => (
                    <div key={b.id} className={`fs-batch-card ${cardCls[b.status]}`} style={{ animationDelay: `${0.05 + i * 0.05}s` }}>
                        <div className={`fs-batch-card__bar ${barCls[b.status]}`} />
                        <div className="fs-batch-card__header">
                            <div style={{ flex: 1 }}>
                                <div className="fs-batch-card__crop">{b.crop}</div>
                                <div className="fs-batch-card__loc">📍 {b.location}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <div className="fs-batch-card__id">{b.id} · Planted on {formatBatchDate(b.created_at)}</div>
                                </div>
                            </div>
                            <span className={`fs-pill ${pillCls[b.status]}`} style={{ fontSize: '0.65rem', padding: '1px 8px' }}>
                                {statusLabel[b.status]}
                            </span>
                        </div>
                        <div className="fs-batch-card__body">
                            <div className="fs-sensor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {/* Air Sensors */}
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">🌡️</span>
                                    <span className="fs-sensor-mini__name">Air Temp</span>
                                    <span className={`fs-sensor-mini__val`}>{b.sensor_data?.air?.temp ?? '--'}°C</span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">🌤️</span>
                                    <span className="fs-sensor-mini__name">Humidity</span>
                                    <span className="fs-sensor-mini__val">{b.sensor_data?.air?.hum ?? '--'}%</span>
                                </div>

                                {/* Soil Sensors */}
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">🌱</span>
                                    <span className="fs-sensor-mini__name">Soil Temp</span>
                                    <span className={`fs-sensor-mini__val`}>{b.sensor_data?.soil?.temp ?? '--'}°C</span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">💧</span>
                                    <span className="fs-sensor-mini__name">Moisture</span>
                                    <span className={`fs-sensor-mini__val`}>{b.sensor_data?.soil?.moisture ?? '--'}%</span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">⚗️</span>
                                    <span className="fs-sensor-mini__name">pH</span>
                                    <span className={`fs-sensor-mini__val`}>{b.sensor_data?.soil?.ph ?? '--'}</span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">⚡</span>
                                    <span className="fs-sensor-mini__name">Soil EC</span>
                                    <span className={`fs-sensor-mini__val`}>{b.sensor_data?.soil?.ec ?? '--'} dS/m</span>
                                </div>
                            </div>

                            {/* NPK Section */}
                            <div style={{ background: 'var(--cream2)', borderRadius: '8px', padding: '12px', marginTop: '8px', marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Est. Soil Nutrients (mg/kg)</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem' }}>
                                    <div style={{ color: 'var(--red)' }}>N: {b.sensor_data?.soil?.est_n ?? '--'}</div>
                                    <div style={{ color: 'var(--gold)' }}>P: {b.sensor_data?.soil?.est_p ?? '--'}</div>
                                    <div style={{ color: 'var(--green)' }}>K: {b.sensor_data?.soil?.est_k ?? '--'}</div>
                                </div>
                            </div>
                            <div
                                className={`fs-ai-box ${aiBoxCls[b.status]} fs-ai-cam ${b.image_analysis ? 'is-clickable' : ''}`}
                                onClick={b.image_analysis ? () => setSelectedAnalysis(b.image_analysis) : undefined}
                                title={b.image_analysis ? "View details" : undefined}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div
                                        style={{
                                            flex: 1,
                                            opacity: b.image_analysis ? 1 : 0.6
                                        }}
                                    >
                                        <div className="fs-ai-box__tag">
                                            <span className="fs-ai-box__emoji">🔍</span> AI Camera Vision
                                        </div>
                                        <div className="fs-ai-box__result">
                                            {b.image_analysis?.detection ?? 'No Scan Data'}
                                        </div>
                                        <div className="fs-ai-box__conf">
                                            {b.image_analysis
                                                ? `Confidence: ${b.image_analysis.confidence}%`
                                                : '--'}
                                        </div>
                                    </div>
                                    {b.image_analysis?.image_base64 && (
                                        <div style={{ width: '60px', height: '60px', marginLeft: '12px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                            <AnnotatedImage src={b.image_analysis.image_base64} boxes={b.image_analysis.bounding_boxes} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="fs-suggestion">
                                <div className="fs-suggestion__label">AI Recommendation</div>
                                {b.ai_report?.analysis ?? 'No analysis available.'}
                            </div>

                            <div className="fs-batch-actions">
                                <button className="fs-btn-scan" onClick={() => setScanBatch(b)} style={{ width: '100%' }}>
                                    <span className="fs-btn-scan__dot">◉</span>Scan with Camera
                                </button>
                                <button className="fs-btn-qr" onClick={() => setQrBatch(b)} title="QR Code">
                                    ▦
                                </button>
                                <div className="fs-card-dropdown">
                                    <button className="fs-icon-btn">⋮</button>
                                    <div className="fs-dropdown-menu">
                                        <button
                                            className="fs-dropdown-item"
                                            onClick={() => handleAnalyzeBatch(b.id)}
                                            disabled={analyzingBatchId === b.id}
                                        >
                                            {analyzingBatchId === b.id ? '⏳ Analyzing...' : '🤖 Trigger Analysis'}
                                        </button>
                                        <button
                                            className="fs-dropdown-item"
                                            onClick={() => { setEditBatch(b); setShowEditModal(true); }}
                                        >
                                            ✏️ Edit Batch
                                        </button>
                                        <button
                                            className="fs-dropdown-item fs-dropdown-item--danger"
                                            onClick={() => { setDeleteBatchId(b.doc_id); setShowDeleteModal(true); }}
                                        >
                                            🗑️ Delete Batch
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="fs-batch-card__last-scan">Last scan: {b.image_analysis?.timestamp
                                ? format(new Date(b.image_analysis.timestamp), "d MMMM yyyy hh:mm:ss a")
                                : 'No scans yet'}</div>
                        </div>
                    </div>
                ))}
            </div>

            {scanBatch && (
                <ScanModal
                    batch={scanBatch}
                    onClose={() => setScanBatch(null)}
                    onSaveSuccess={refetch}
                />
            )}
            {qrBatch && <QRModal batch={qrBatch} onClose={() => setQrBatch(null)} />}
            {showRegisterModal && (
                <RegisterBatchModal
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitBatch}
                    formData={newBatchForm}
                    setFormData={setNewBatchForm}
                    submitting={submitting}
                />
            )}
            {showEditModal && editBatch && (
                <EditBatchModal
                    batch={editBatch}
                    onClose={() => { setShowEditModal(false); setEditBatch(null); }}
                    onSubmit={handleEditSubmission}
                />
            )}
            {showDeleteModal && deleteBatchId && (
                <DeleteBatchModal
                    batchId={deleteBatchId}
                    onClose={() => { setShowDeleteModal(false); setDeleteBatchId(null); }}
                    onDelete={() => handleDeleteSubmission(deleteBatchId)}
                />
            )}
            {selectedAnalysis && (
                <ImageDetailsModal
                    analysis={selectedAnalysis}
                    onClose={() => setSelectedAnalysis(null)}
                />
            )}
        </>
    );
}

