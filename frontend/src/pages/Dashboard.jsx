import { useState } from "react";
import { useBatches } from "../useBatches.js";
import ScanModal from "../components/ScanModal";
import QRModal from "../components/QRModal";
import RegisterBatchModal from "../components/RegisterBatchModal";
import toast from 'react-hot-toast';
import "../farmsense.css";

export default function DashboardPage() {
    const { batches, addBatch } = useBatches();
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [scanBatch, setScanBatch] = useState(null);
    const [qrBatch, setQrBatch] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [newBatchForm, setNewBatchForm] = useState({ crop: "", location: "", notes: "" });
    const [submitting, setSubmitting] = useState(false);

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

    const statusLabel = { healthy: "✓ Healthy", warning: "⚡ Warning", danger: "⚠ Critical" };
    const aiBoxCls = { healthy: "", warning: "fs-ai-box--warn", danger: "fs-ai-box--alert" };
    const cardCls = { healthy: "", warning: "fs-batch-card--warn", danger: "fs-batch-card--danger" };
    const barCls = { healthy: "fs-batch-card__bar--healthy", warning: "fs-batch-card__bar--warning", danger: "fs-batch-card__bar--danger" };
    const pillCls = { healthy: "fs-pill--healthy", warning: "fs-pill--warning", danger: "fs-pill--danger" };

    const todayDate = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <>
            <div className="fs-page-header">
                <div>
                    <div className="fs-page-eyebrow">{todayDate} · Kota Kinabalu</div>
                    <h1 className="fs-page-title">
                        Crop <em>Intelligence</em> Dashboard
                    </h1>
                    <p className="fs-page-sub"></p>
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

            <div className="fs-batch-grid">
                {filtered.map((b, i) => (
                    <div key={b.id} className={`fs-batch-card ${cardCls[b.status]}`} style={{ animationDelay: `${0.05 + i * 0.05}s` }}>
                        <div className={`fs-batch-card__bar ${barCls[b.status]}`} />
                        <div className="fs-batch-card__header">
                            <div>
                                <div className="fs-batch-card__crop">{b.crop}</div>
                                <div className="fs-batch-card__loc">📍 {b.location}</div>
                                <div className="fs-batch-card__id">{b.id} · Planted {b.created_at}</div>
                            </div>
                            <span className={`fs-pill ${pillCls[b.status]}`}>{statusLabel[b.status]}</span>
                        </div>
                        <div className="fs-batch-card__body">
                            <div className="fs-sensor-row">
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">🌡️</span>
                                    <span className="fs-sensor-mini__name">Temp</span>
                                    <span className={`fs-sensor-mini__val fs-sensor-mini__val--${b.status === 'danger' ? 'warn' : 'ok'}`}>
                                        {b.status === 'danger' ? '34°C' : '28°C'}
                                    </span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">💧</span>
                                    <span className="fs-sensor-mini__name">Moisture</span>
                                    <span className={`fs-sensor-mini__val fs-sensor-mini__val--${b.status === 'danger' ? 'bad' : 'ok'}`}>
                                        {b.status === 'danger' ? '42%' : '70%'}
                                    </span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">🌤️</span>
                                    <span className="fs-sensor-mini__name">Humidity</span>
                                    <span className="fs-sensor-mini__val fs-sensor-mini__val--ok">68%</span>
                                </div>
                                <div className="fs-sensor-mini">
                                    <span className="fs-sensor-mini__icon">⚗️</span>
                                    <span className="fs-sensor-mini__name">pH</span>
                                    <span className={`fs-sensor-mini__val fs-sensor-mini__val--${b.status === 'danger' ? 'warn' : 'ok'}`}>
                                        {b.status === 'danger' ? '5.8' : '6.8'}
                                    </span>
                                </div>
                            </div>
                            <div className={`fs-ai-box ${aiBoxCls[b.status]} fs-ai-cam`}>
                                <div>
                                    <div className="fs-ai-box__tag">
                                        <span className="fs-ai-box__emoji">🔍</span> AI Camera Vision
                                    </div>
                                    <div className="fs-ai-box__result">
                                        {b.status === 'danger' ? 'Early Blight Detected' :
                                            b.status === 'warning' ? 'Aphid Presence' : 'No Disease Detected'}
                                    </div>
                                    <div className="fs-ai-box__conf">Confidence: 92% · 2h ago</div>
                                </div>
                            </div>
                            <div className="fs-suggestion">
                                <div className="fs-suggestion__label">AI Recommendation</div>
                                {b.status === 'danger' ? 'Apply copper fungicide within 24h. Remove affected leaves.' :
                                    b.status === 'warning' ? 'Monitor aphids. Consider neem oil spray.' :
                                        'Crop healthy. Maintain current irrigation schedule.'}
                            </div>
                            <div className="fs-batch-actions">
                                <button className="fs-btn-scan" onClick={() => setScanBatch(b)}>
                                    <span className="fs-btn-scan__dot">◉</span>Image
                                </button>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="fs-btn-qr" onClick={() => setQrBatch(b)} title="QR Code">
                                        ▦
                                    </button>
                                </div>
                            </div>
                            <div className="fs-batch-card__last-scan">Last scan: Today 08:42 AM</div>
                        </div>
                    </div>
                ))}
            </div>

            {scanBatch && <ScanModal batch={scanBatch} onClose={() => setScanBatch(null)} />}
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
        </>
    );
}

