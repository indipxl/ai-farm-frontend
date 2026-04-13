import { useState } from "react";
import { useBatches } from "../useBatches.js";
import ScanModal from "../components/ScanModal";
import QRModal from "../components/QRModal";
import RegisterBatchModal from "../components/RegisterBatchModal";
import FieldMap from "../components/FieldMap";
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

            {/* Field Map Section */}
            <FieldMap batches={batches} />
        </>
    );
}

