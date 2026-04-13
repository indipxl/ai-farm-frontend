import { useState } from "react";
import { useBatches } from "../useBatches.js";
import ScanModal from "../components/ScanModal";
import QRModal from "../components/QRModal";
import RegisterBatchModal from "../components/RegisterBatchModal";
import ImageDetailsModal from "../components/ImageDetailsModal";
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import "../farmsense.css";

export default function BatchProfilesPage() {
    const { batches, addBatch, refetch } = useBatches();
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [scanBatch, setScanBatch] = useState(null);
    const [qrBatch, setQrBatch] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [newBatchForm, setNewBatchForm] = useState({ crop: "", location: "", notes: "" });
    const [submitting, setSubmitting] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);

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
        } catch {
            toast.error("Failed to register batch.");
        } finally {
            setSubmitting(false);
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

    const statusLabel = { healthy: "Healthy", warning: "Warning", danger: "Critical" };
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
                    <div className="fs-page-eyebrow">Custom Batch Configuration</div>
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
                <div>
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
                            <div>
                                <div className="fs-batch-card__crop">{b.crop}</div>
                                <div className="fs-batch-card__loc">📍 {b.location}</div>
                                <div className="fs-batch-card__id">{b.id} · Planted {formatBatchDate(b.created_at)}</div>
                            </div>
                            <span className={`fs-pill ${pillCls[b.status]}`}>{statusLabel[b.status]}</span>
                        </div>
                        <div className="fs-batch-card__body">
                            <div className="fs-sensor-row">
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">🌡️</span>
                                    <span className="fs-sensor-mini__name">Temp</span>
                                    <span className={`fs-sensor-mini__val`}>
                                        {b.sensor_data?.air?.temp ?? '--'}°C
                                    </span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">💧</span>
                                    <span className="fs-sensor-mini__name">Moisture</span>
                                    <span className={`fs-sensor-mini__val`}>
                                        {b.sensor_data?.soil?.moisture ?? '--'}%
                                    </span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">🌤️</span>
                                    <span className="fs-sensor-mini__name">Humidity</span>
                                    <span className="fs-sensor-mini__val">{b.sensor_data?.air?.hum ?? '--'}%</span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">⚗️</span>
                                    <span className="fs-sensor-mini__name">pH</span>
                                    <span className={`fs-sensor-mini__val`}>
                                        {b.sensor_data?.soil?.ph ?? '--'}
                                    </span>
                                </div>
                            </div>
                            <div className={`fs-ai-box ${aiBoxCls[b.status]} fs-ai-cam`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div
                                        style={{
                                            flex: 1,
                                            cursor: b.image_analysis ? 'pointer' : 'default',
                                            opacity: b.image_analysis ? 1 : 0.6
                                        }}
                                        onClick={b.image_analysis ? () => setSelectedAnalysis(b.image_analysis) : undefined}
                                        title={b.image_analysis ? "View details" : undefined}
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
                                </div>
                            </div>
                            <div className="fs-suggestion">
                                <div className="fs-suggestion__label">AI Recommendation</div>
                                {b.ai_report?.analysis ?? 'No analysis available.'}
                            </div>
                            <div className="fs-batch-actions">
                                <button className="fs-btn-scan" onClick={() => setScanBatch(b)}>
                                    <span className="fs-btn-scan__dot">◉</span>Scan with Camera
                                </button>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {/* <button
                                        className="fs-btn fs-btn--ghost fs-btn--sm"
                                        onClick={() => {
                                            setEditBatch(b);
                                            setShowEditModal(true);
                                        }}
                                        title="Edit batch"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="fs-btn fs-btn--danger fs-btn--sm"
                                        onClick={() => {
                                            setDeleteBatchId(b.id);
                                            setShowDeleteModal(true);
                                        }}
                                        title="Delete batch"
                                    >
                                        🗑️ Delete
                                    </button> */}
                                    {/* <button className="fs-btn-qr" onClick={() => setQrBatch(b)} title="QR Code">
                                        ▦
                                    </button> */}
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
            {selectedAnalysis && (
                <ImageDetailsModal
                    analysis={selectedAnalysis}
                    onClose={() => setSelectedAnalysis(null)}
                />
            )}
        </>
    );
}

