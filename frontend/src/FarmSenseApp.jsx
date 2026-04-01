import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./farmsense.css";
import { useBatches } from "./useBatches"
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import toast from 'react-hot-toast';
// ═══════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════

const INITIAL_BATCHES = [
  {
    id: "BATCH-001", crop: "🍅 Tomatoes", location: "Block A · Row 1–12", planted: "12 Jan 2026", status: "danger",
    sensors: [{ icon: "🌡️", name: "Temp", val: "34°C", state: "warn" }, { icon: "💧", name: "Moisture", val: "42%", state: "bad" }, { icon: "🌤️", name: "Humidity", val: "68%", state: "ok" }, { icon: "⚗️", name: "pH", val: "5.8", state: "warn" }],
    aiDetection: "Early Blight (Alternaria solani)", aiConf: "Confidence: 91% · 2h ago",
    suggestion: "Apply copper-based fungicide within 24 hours. Remove affected lower leaves. Raise soil moisture above 60%.", lastScan: "Today 08:42 AM"
  },
  {
    id: "BATCH-002", crop: "🥬 Lettuce", location: "Block B · Row 1–8", planted: "20 Jan 2026", status: "warning",
    sensors: [{ icon: "🌡️", name: "Temp", val: "26°C", state: "ok" }, { icon: "💧", name: "Moisture", val: "58%", state: "warn" }, { icon: "🌤️", name: "Humidity", val: "72%", state: "ok" }, { icon: "⚗️", name: "pH", val: "6.4", state: "ok" }],
    aiDetection: "Aphid Presence — Low Density", aiConf: "Confidence: 78% · 5h ago",
    suggestion: "Monitor daily. Consider neem oil spray. No chemical treatment needed yet.", lastScan: "Today 05:15 AM"
  },
  {
    id: "BATCH-003", crop: "🫑 Bell Peppers", location: "Block C · Row 3–10", planted: "5 Jan 2026", status: "healthy",
    sensors: [{ icon: "🌡️", name: "Temp", val: "28°C", state: "ok" }, { icon: "💧", name: "Moisture", val: "70%", state: "ok" }, { icon: "🌤️", name: "Humidity", val: "65%", state: "ok" }, { icon: "⚗️", name: "pH", val: "6.8", state: "ok" }],
    aiDetection: "No Disease or Pest Detected", aiConf: "Confidence: 97% · 1h ago",
    suggestion: "Excellent condition. Consider NPK fertiliser next week as plants approach fruiting stage.", lastScan: "Today 09:05 AM"
  },
  {
    id: "BATCH-004", crop: "🥒 Cucumber", location: "Block D · Row 1–6", planted: "18 Jan 2026", status: "healthy",
    sensors: [{ icon: "🌡️", name: "Temp", val: "27°C", state: "ok" }, { icon: "💧", name: "Moisture", val: "74%", state: "ok" }, { icon: "🌤️", name: "Humidity", val: "70%", state: "ok" }, { icon: "⚗️", name: "pH", val: "6.5", state: "ok" }],
    aiDetection: "No Disease or Pest Detected", aiConf: "Confidence: 94% · 3h ago",
    suggestion: "On target. Ensure trellis support is secure. Continue current drip irrigation.", lastScan: "Today 07:20 AM"
  },
  {
    id: "BATCH-005", crop: "🍅 Tomatoes", location: "Block E · Row 1–4", planted: "2 Feb 2026", status: "healthy",
    sensors: [{ icon: "🌡️", name: "Temp", val: "24°C", state: "ok" }, { icon: "💧", name: "Moisture", val: "68%", state: "ok" }, { icon: "🌤️", name: "Humidity", val: "62%", state: "ok" }, { icon: "⚗️", name: "pH", val: "5.9", state: "ok" }],
    aiDetection: "No Disease or Pest Detected", aiConf: "Confidence: 95% · 2h ago",
    suggestion: "Flowering stage. Avoid wetting foliage to reduce botrytis risk.", lastScan: "Today 08:00 AM"
  },
  {
    id: "BATCH-006", crop: "🫛 Long Beans", location: "Block F · Row 1–10", planted: "25 Jan 2026", status: "healthy",
    sensors: [{ icon: "🌡️", name: "Temp", val: "29°C", state: "ok" }, { icon: "💧", name: "Moisture", val: "66%", state: "ok" }, { icon: "🌤️", name: "Humidity", val: "67%", state: "ok" }, { icon: "⚗️", name: "pH", val: "6.2", state: "ok" }],
    aiDetection: "No Disease or Pest Detected", aiConf: "Confidence: 92% · 4h ago",
    suggestion: "Healthy growth. Add potassium supplement in 2 weeks for pod development.", lastScan: "Today 06:45 AM"
  },
];

const SOIL_BLOCKS = [
  {
    id: "A", crop: "🍅 Tomatoes", loc: "Block A", score: 48, grade: "poor",
    metrics: [{ name: "Moisture", val: "42%", state: "bad" }, { name: "pH", val: "5.8", state: "warn" }, { name: "Nitrogen", val: "Low", state: "bad" }, { name: "Phosphorus", val: "Med", state: "warn" }],
    bars: [{ name: "Moisture", pct: 42, state: "bad" }, { name: "Organic Matter", pct: 30, state: "warn" }, { name: "Nitrogen (N)", pct: 25, state: "bad" }]
  },
  {
    id: "B", crop: "🥬 Lettuce", loc: "Block B", score: 67, grade: "ok",
    metrics: [{ name: "Moisture", val: "58%", state: "warn" }, { name: "pH", val: "6.4", state: "ok" }, { name: "Nitrogen", val: "Med", state: "warn" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 58, state: "warn" }, { name: "Organic Matter", pct: 54, state: "ok" }, { name: "Nitrogen (N)", pct: 48, state: "warn" }]
  },
  {
    id: "C", crop: "🫑 Peppers", loc: "Block C", score: 89, grade: "great",
    metrics: [{ name: "Moisture", val: "70%", state: "ok" }, { name: "pH", val: "6.8", state: "ok" }, { name: "Nitrogen", val: "Good", state: "ok" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 70, state: "ok" }, { name: "Organic Matter", pct: 78, state: "ok" }, { name: "Nitrogen (N)", pct: 82, state: "ok" }]
  },
  {
    id: "D", crop: "🥒 Cucumber", loc: "Block D", score: 85, grade: "great",
    metrics: [{ name: "Moisture", val: "74%", state: "ok" }, { name: "pH", val: "6.5", state: "ok" }, { name: "Nitrogen", val: "Good", state: "ok" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 74, state: "ok" }, { name: "Organic Matter", pct: 70, state: "ok" }, { name: "Nitrogen (N)", pct: 76, state: "ok" }]
  },
  {
    id: "E", crop: "🍓 Strawberry", loc: "Block E", score: 81, grade: "great",
    metrics: [{ name: "Moisture", val: "68%", state: "ok" }, { name: "pH", val: "5.9", state: "ok" }, { name: "Nitrogen", val: "Good", state: "ok" }, { name: "Phosphorus", val: "Med", state: "warn" }],
    bars: [{ name: "Moisture", pct: 68, state: "ok" }, { name: "Organic Matter", pct: 65, state: "ok" }, { name: "Nitrogen (N)", pct: 70, state: "ok" }]
  },
  {
    id: "F", crop: "🫛 Long Beans", loc: "Block F", score: 74, grade: "ok",
    metrics: [{ name: "Moisture", val: "66%", state: "ok" }, { name: "pH", val: "6.2", state: "ok" }, { name: "Nitrogen", val: "Med", state: "warn" }, { name: "Phosphorus", val: "Good", state: "ok" }],
    bars: [{ name: "Moisture", pct: 66, state: "ok" }, { name: "Organic Matter", pct: 60, state: "ok" }, { name: "Nitrogen (N)", pct: 52, state: "warn" }]
  },
];

const MAP_BLOCKS = [
  { id: "A1", label: "A1", crop: "🍅", status: "danger", name: "Tomatoes" }, { id: "A2", label: "A2", crop: "🍅", status: "danger", name: "Tomatoes" },
  { id: "A3", label: "A3", crop: "🥬", status: "warning", name: "Lettuce" }, { id: "A4", label: "A4", crop: "🥬", status: "healthy", name: "Lettuce" },
  { id: "A5", label: "A5", crop: "", status: "empty", name: "" }, { id: "A6", label: "A6", crop: "", status: "empty", name: "" },
  { id: "B1", label: "B1", crop: "🍅", status: "warning", name: "Tomatoes" }, { id: "B2", label: "B2", crop: "🫑", status: "healthy", name: "Peppers" },
  { id: "B3", label: "B3", crop: "🫑", status: "healthy", name: "Peppers" }, { id: "B4", label: "B4", crop: "🥒", status: "healthy", name: "Cucumber" },
  { id: "B5", label: "B5", crop: "🥒", status: "healthy", name: "Cucumber" }, { id: "B6", label: "B6", crop: "", status: "empty", name: "" },
  { id: "C1", label: "C1", crop: "🫛", status: "healthy", name: "Long Beans" }, { id: "C2", label: "C2", crop: "🫛", status: "healthy", name: "Long Beans" },
  { id: "C3", label: "C3", crop: "🍓", status: "healthy", name: "Strawberry" }, { id: "C4", label: "C4", crop: "🍓", status: "healthy", name: "Strawberry" },
  { id: "C5", label: "C5", crop: "🥬", status: "warning", name: "Lettuce" }, { id: "C6", label: "C6", crop: "", status: "empty", name: "" },
  { id: "D1", label: "D1", crop: "", status: "empty", name: "" }, { id: "D2", label: "D2", crop: "🫑", status: "healthy", name: "Peppers" },
  { id: "D3", label: "D3", crop: "🫑", status: "healthy", name: "Peppers" }, { id: "D4", label: "D4", crop: "🥒", status: "healthy", name: "Cucumber" },
  { id: "D5", label: "D5", crop: "", status: "empty", name: "" }, { id: "D6", label: "D6", crop: "", status: "empty", name: "" },
];

const THREAT_LOG = [
  { icon: "🔴", title: "Early Blight spreading from Block A1 → A2", desc: "Fungal pathogen detected in 2 adjacent blocks. Wind direction NE at 12km/h increases spread risk toward Block B1.", meta: "Detected 2h ago · High risk", type: "danger" },
  { icon: "🟡", title: "Aphid colony movement detected — Block A3 → C5", desc: "Low-density aphid population migrated across 3 blocks. Natural predator activity noted in Block B area.", meta: "Detected 6h ago · Moderate risk", type: "warn" },
  { icon: "🟡", title: "Temperature stress risk — Blocks A1, A2, B1", desc: "Sustained high temperature (>33°C) for 3 days creates conditions favourable for pest activity. Monitor closely.", meta: "Ongoing · Moderate risk", type: "warn" },
  { icon: "🟢", title: "Whitefly threat resolved — Block D2, D3", desc: "Whitefly population declined after neem oil treatment applied 4 days ago. No further spread detected.", meta: "Resolved 2 days ago · Low risk", type: "resolved" },
];

const CROP_PROFILES = [
  {
    id: 1, emoji: "🍅", name: "Tomatoes (Summer)", type: "Solanum lycopersicum", assignedTo: "BATCH-001",
    params: [{ name: "Soil Moisture", min: 55, max: 80, unit: "%", pct: 70 }, { name: "Temperature", min: 21, max: 29, unit: "°C", pct: 60 }, { name: "Humidity", min: 60, max: 75, unit: "%", pct: 68 }, { name: "Soil pH", min: 6.0, max: 6.8, unit: "", pct: 55 }],
    alert: "Alert if moisture < 55% or > 85%", notes: "Spray copper fungicide every 14 days preventatively."
  },
  {
    id: 2, emoji: "🥬", name: "Lettuce (Butterhead)", type: "Lactuca sativa", assignedTo: "BATCH-002",
    params: [{ name: "Soil Moisture", min: 65, max: 75, unit: "%", pct: 65 }, { name: "Temperature", min: 16, max: 24, unit: "°C", pct: 45 }, { name: "Humidity", min: 60, max: 80, unit: "%", pct: 72 }, { name: "Soil pH", min: 6.0, max: 7.0, unit: "", pct: 60 }],
    alert: "Alert if temp > 28°C (bolting risk)", notes: "Avoid overhead watering to prevent fungal issues."
  },
  {
    id: 3, emoji: "🫑", name: "Bell Peppers", type: "Capsicum annuum", assignedTo: "BATCH-003, BATCH-D2",
    params: [{ name: "Soil Moisture", min: 60, max: 70, unit: "%", pct: 60 }, { name: "Temperature", min: 24, max: 30, unit: "°C", pct: 65 }, { name: "Humidity", min: 50, max: 70, unit: "%", pct: 58 }, { name: "Soil pH", min: 6.0, max: 6.8, unit: "", pct: 55 }],
    alert: "Alert if humidity > 80% (mould risk)", notes: "Side-dress with potassium when fruiting starts."
  },
  {
    id: 4, emoji: "🍓", name: "Strawberries", type: "Fragaria × ananassa", assignedTo: "BATCH-005",
    params: [{ name: "Soil Moisture", min: 60, max: 70, unit: "%", pct: 62 }, { name: "Temperature", min: 15, max: 26, unit: "°C", pct: 42 }, { name: "Humidity", min: 55, max: 75, unit: "%", pct: 60 }, { name: "Soil pH", min: 5.5, max: 6.5, unit: "", pct: 45 }],
    alert: "Alert if rain >20mm predicted (botrytis)", notes: "Use drip irrigation only. Keep foliage dry."
  },
];

const AI_RESULTS = {
  healthy: { icon: "✅", title: "No Disease or Pest Detected", conf: "Confidence: 95%", detail: "No visible signs of disease or pest infestation. Leaf colour and texture are within normal parameters.", sugs: ["Maintain current irrigation and fertilisation", "Schedule next scan in 48–72 hours", "Document healthy baseline for trend comparison"] },
  aphid: { icon: "🔎", title: "Aphid Infestation — Early Stage", conf: "Confidence: 82% · Aphis gossypii", detail: "Small aphid colonies detected on undersides of younger leaves. Colony density is low — early intervention will prevent rapid growth.", sugs: ["Apply neem oil spray (2% solution) morning or evening", "Encourage natural predators (ladybugs, lacewings)", "Avoid high-nitrogen fertiliser", "Re-scan in 72 hours"] },
  blight: { icon: "⚠️", title: "Early Blight Detected", conf: "Confidence: 91% · Alternaria solani", detail: "Concentric ring lesions observed on lower leaves. Approximately 15% of foliage affected. Treat promptly.", sugs: ["Apply copper-based fungicide within 24 hours", "Remove and dispose of affected leaves — do not compost", "Raise soil moisture above 60%", "Re-scan in 48 hours"] },
};
const PROC_STEPS = ["Extracting visual features...", "Checking disease patterns...", "Cross-referencing pest database...", "Generating recommendations...", "Finalising analysis..."];

const HEATMAP_DATA = (() => {
  const cells = [];
  const tempValues = [
    28, 29, 31, 34, 33, 32, 30, 28,
    27, 30, 32, 35, 34, 33, 31, 29,
    26, 29, 31, 33, 35, 34, 32, 30,
    27, 28, 30, 32, 34, 33, 31, 29,
    26, 27, 29, 31, 32, 31, 30, 28,
    25, 26, 28, 29, 30, 29, 28, 27,
  ];
  tempValues.forEach((t, i) => {
    const norm = (t - 24) / 12;
    let bg;
    if (norm < 0.25) bg = `rgba(41,128,185,${0.5 + norm})`;
    else if (norm < 0.5) bg = `rgba(39,174,96,${0.5 + norm * 0.5})`;
    else if (norm < 0.75) bg = `rgba(243,156,18,${0.5 + norm * 0.4})`;
    else bg = `rgba(231,76,60,${0.6 + norm * 0.3})`;
    cells.push({ temp: t, bg });
  });
  return cells;
})();

const WEATHER = [
  { day: "Today", icon: "⛅", temp: "32°C", rain: "10%", today: true },
  { day: "Mon", icon: "🌧️", temp: "27°C", rain: "80%" },
  { day: "Tue", icon: "🌦️", temp: "28°C", rain: "45%" },
  { day: "Wed", icon: "☀️", temp: "33°C", rain: "5%" },
  { day: "Thu", icon: "☀️", temp: "34°C", rain: "5%" },
];

const SPRAY_WINDOWS = [
  { time: "05:30 – 07:30", desc: "Ideal. Low wind, no rain, cool temp.", dot: "safe" },
  { time: "08:00 – 11:00", desc: "Acceptable. Monitor wind speed.", dot: "caution" },
  { time: "11:00 – 16:00", desc: "Avoid. High temp causes rapid evaporation.", dot: "unsafe" },
  { time: "17:30 – 19:30", desc: "Good. Calm evening conditions expected.", dot: "safe" },
];

// ═══════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════

function BaseTopbar({ children, className = "", style = {} }) {
  return (
    <div className={`fs-topbar ${className}`} style={style}>
      {children}

      <div className="fs-topbar__right">
        <span className="fs-topbar__sync">IoT sync: <span>● Live</span></span>
        <span className="fs-alert-badge">2 Alerts</span>
      </div>
    </div>
  );
}

const defaultPageTopbarStyle = {
  display: "flex",
  padding: "25px",
  marginBottom: "20px"
};

function TopbarAtmosphere() {
  const [heatType, setHeatType] = useState("Temperature");

  return (
    // <BaseTopbar>
    //   <div className="fs-filter-group">
    //     {["Temperature", "Humidity", "Wind"].map(t => (
    //       <button
    //         key={t}
    //         className={`fs-filter-pill ${heatType === t ? "fs-filter-pill--active" : ""}`}
    //         onClick={() => setHeatType(t)}
    //       >
    //         {t}
    //       </button>
    //     ))}
    //   </div>
    // </BaseTopbar>
    <BaseTopbar />
  );
}

function TopbarDashboard() {
  return (
    <BaseTopbar style={defaultPageTopbarStyle} />
  );
}

function TopbarSoilHealth() {

  return (
    <BaseTopbar style={defaultPageTopbarStyle}>
    </BaseTopbar>
  );
}

function TopbarDiseaseMap() {

  return (
    <BaseTopbar style={defaultPageTopbarStyle}>
      <div style={{ display: "flex", gap: 10 }}>
        {/* <button className="fs-btn fs-btn--danger fs-btn--sm">🔔 Send Alert</button> */}
      </div>
    </BaseTopbar>
  );
}

function TopbarCropProfile() {
  return (
    <BaseTopbar style={defaultPageTopbarStyle}>

    </BaseTopbar>
  );
}

function ScanModal({ batch, onClose }) {
  const [phase, setPhase] = useState("upload");
  const [step, setStep] = useState(PROC_STEPS[0]);
  const [result, setResult] = useState(null);
  const fileRef = useRef();
  if (!batch) return null;

  const startProcessing = () => {
    setPhase("processing");
    let i = 0;
    const iv = setInterval(() => {
      if (i < PROC_STEPS.length) { setStep(PROC_STEPS[i++]); }
      else {
        clearInterval(iv);
        const keys = Object.keys(AI_RESULTS);
        setResult(AI_RESULTS[keys[Math.floor(Math.random() * keys.length)]]);
        setPhase("result");
      }
    }, 850);
  };

  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={e => e.stopPropagation()}>
        <div className="fs-camera-view">
          <span className="fs-camera-view__bg">📷</span>
          <div className="fs-scan-frame-wrap"><div className="fs-scan-frame" /></div>
        </div>
        <div className="fs-modal__header">
          <div className="fs-modal__eyebrow">AI Camera Vision</div>
          <div className="fs-modal__title">Scanning: <span style={{ color: "var(--gold-dim)" }}>{batch.crop}</span></div>
          <div className="fs-modal__sub">{batch.id} · Point camera at leaves or stems</div>
        </div>
        <div className="fs-modal__body">
          {phase === "upload" && (
            <>
              <div className="fs-upload-drop" onClick={() => fileRef.current.click()}>
                <div style={{ fontSize: "1.5rem" }}>📁</div>
                <div style={{ fontSize: "0.79rem", color: "var(--text-dim)", marginTop: "5px" }}>Upload a plant photo to analyse</div>
                <div style={{ fontSize: "0.67rem", color: "#aaa", marginTop: "2px" }}>JPG, PNG up to 10MB</div>
              </div>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={startProcessing} />
              <button className="fs-btn-upload" onClick={() => fileRef.current.click()}>📸 Take / Upload Photo</button>
              <button className="fs-btn-cancel" onClick={onClose}>Cancel</button>
            </>
          )}
          {phase === "processing" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div className="fs-spinner" />
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1rem", marginBottom: "5px" }}>Analysing Plant...</div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-dim)" }}>AI examining image for disease and pests</div>
              <div className="fs-proc-step">{step}</div>
            </div>
          )}
          {phase === "result" && result && (
            <>
              <div style={{ display: "flex", gap: "11px", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "1.9rem" }}>{result.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.05rem" }}>{result.title}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "2px" }}>{result.conf}</div>
                </div>
              </div>
              <div style={{ background: "var(--cream2)", borderRadius: "10px", padding: "11px 13px", marginBottom: "12px", fontSize: "0.78rem", lineHeight: 1.55, border: "1px solid var(--border)" }}>{result.detail}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "7px" }}>Recommended Actions</div>
              {result.sugs.map((s, i) => <div key={i} className="fs-result-sug">{s}</div>)}
              <button className="fs-btn-upload" style={{ marginTop: "10px" }} onClick={onClose}>✓ Save to Batch Record</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QRModal({ batch, onClose }) {
  if (!batch) return null;
  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={e => e.stopPropagation()}>
        <div className="fs-modal__header">
          <div className="fs-modal__eyebrow">Batch QR Code</div>
          <div className="fs-modal__title">{batch.crop}</div>
          <div className="fs-modal__sub">Scan to link your phone camera to this batch</div>
        </div>
        <div className="fs-modal__body" style={{ textAlign: "center" }}>
          <div className="fs-qr-box">▦</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.78rem", color: "var(--gold-dim)", letterSpacing: "3px", marginBottom: "8px" }}>{batch.id}</div>
          <p style={{ fontSize: "0.77rem", color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.6 }}>Print and attach to row marker. All camera scans will be automatically attributed to <strong style={{ color: "var(--charcoal)" }}>{batch.crop}</strong>.</p>
          <button className="fs-btn--primary fs-btn" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function RegisterBatchModal({ onClose, onSubmit, formData, setFormData, submitting }) {
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onSubmit(formData);

      toast.success(`Successfully registered!`, {
        style: {
          border: '1px solid #4a7c59',
          padding: '16px',
          color: '#1c1f16',
          background: '#f0ece4',
        },
        iconTheme: {
          primary: '#4a7c59',
          secondary: '#FFFAEE',
        },
      });

      onClose();
    } catch (error) {
      toast.error("Failed to register batch. Please try again.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValid = formData.crop.trim() && formData.location.trim() && formData.planted;

  return (
    <div className="fs-modal-overlay" onClick={onClose} style={RegisterBatchModalStyle.overlay}>
      <div className="fs-modal" onClick={e => e.stopPropagation()} style={RegisterBatchModalStyle.modal}>

        <div style={RegisterBatchModalStyle.header}>
          <h2 style={RegisterBatchModalStyle.title}>Register New Batch</h2>
          <p style={RegisterBatchModalStyle.subtitle}>Enter details to start tracking this crop cycle.</p>
        </div>

        <form onSubmit={handleSubmit} style={RegisterBatchModalStyle.form}>
          <div style={RegisterBatchModalStyle.grid}>
            {/* Crop Name */}
            <div style={RegisterBatchModalStyle.group}>
              <label style={RegisterBatchModalStyle.label}>Crop Name *</label>
              <input
                style={RegisterBatchModalStyle.input}
                name="crop"
                placeholder="e.g. 🌴 Oil Palm"
                value={formData.crop}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Location */}
            <div style={RegisterBatchModalStyle.group}>
              <label style={RegisterBatchModalStyle.label}>Location *</label>
              <input
                style={RegisterBatchModalStyle.input}
                name="location"
                placeholder="e.g. Sabah Section A1"
                value={formData.location}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Planted Date */}
            <div style={RegisterBatchModalStyle.group}>
              <label style={RegisterBatchModalStyle.label}>Planted Date *</label>
              <input
                style={RegisterBatchModalStyle.input}
                type="date"
                name="planted"
                value={formData.planted}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Notes */}
            <div style={RegisterBatchModalStyle.group}>
              <label style={RegisterBatchModalStyle.label}>Notes (optional)</label>
              <textarea
                style={{ ...RegisterBatchModalStyle.input, height: '80px', resize: 'none' }}
                name="notes"
                placeholder="Fertilizer type, soil condition..."
                value={formData.notes}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={RegisterBatchModalStyle.footer}>
            <button
              type="button"
              onClick={onClose}
              style={RegisterBatchModalStyle.cancelBtn}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...RegisterBatchModalStyle.submitBtn,
                opacity: (!isValid || submitting) ? 0.6 : 1,
                cursor: (!isValid || submitting) ? 'not-allowed' : 'pointer'
              }}
              disabled={!isValid || submitting}
            >
              {submitting ? 'Processing...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PAGE: DASHBOARD
// ═══════════════════════════════════════════════

function DashboardPage() {
  const { batches, addBatch, updateBatch, deleteBatch } = useBatches();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [scanBatch, setScanBatch] = useState(null);
  const [qrBatch, setQrBatch] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBatchId, setDeleteBatchId] = useState(null);
  const [newBatchForm, setNewBatchForm] = useState({ crop: "", location: "", planted: "", notes: "" });

  const handleOpenModal = () => {
    setShowRegisterModal(true);
  };

  const handleCloseModal = () => {
    setShowRegisterModal(false);
    setNewBatchForm({ crop: "", location: "", planted: "", notes: "" });
  };

  const handleFormChange = (e) => {
    setNewBatchForm({ ...newBatchForm, [e.target.name]: e.target.value });
  };

  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitBatch = async (formData) => {
    setSubmitting(true);
    try {
      await addBatch(formData);
      setNotification({
        type: 'success',
        message: `✅ ${formData.crop} batch registered successfully!`
      });
      setTimeout(() => setNotification(null), 4000);
      handleCloseModal();
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to register batch. Please try again.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };
  const alertCount = batches.filter(b => b.status !== "healthy").length;

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

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Sunday, 1 March 2026 · Kota Kinabalu</div>
          <h1 className="fs-page-title">Crop <em>Intelligence</em> Dashboard</h1>
          <p className="fs-page-sub">Monitoring {batches.length} active batches · Last sensor sync 4 min ago</p>
        </div>
      </div>

      <TopbarDashboard />

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Active Batches</div><div className="fs-stat-card__val">{batches.length}</div><div className="fs-stat-card__meta">Vegetables &amp; Fruits</div><span className="fs-stat-tag fs-stat-tag--good">All updated</span></div>
        <div className="fs-stat-card fs-stat-card--red"><div className="fs-stat-card__label">Alerts</div><div className="fs-stat-card__val fs-stat-card__val--danger">{alertCount}</div><div className="fs-stat-card__meta">Requires attention</div><span className="fs-stat-tag fs-stat-tag--danger">Critical</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Avg. Soil Moisture</div><div className="fs-stat-card__val fs-stat-card__val--warn">61%</div><div className="fs-stat-card__meta">Optimal 65–75%</div><span className="fs-stat-tag fs-stat-tag--warn">Low</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Healthy Batches</div><div className="fs-stat-card__val">4</div><div className="fs-stat-card__meta">No issues detected</div><span className="fs-stat-tag fs-stat-tag--good">On track</span></div>
      </div>

      <div className="fs-section-row">
        <div className="fs-section-label">Registered Batches</div>
        <div>
          <button className="fs-btn fs-btn--gold fs-btn--sm" onClick={handleOpenModal}>+ Register New Batch</button>
        </div >
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
          {searchQuery && (
            <>
              <button
                className="fs-search-reset"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                Reset
              </button>
            </>
          )}
        </div>
        <div className="fs-filter-group">
          {["All", "Alerts", "Healthy"].map(f => (
            <button key={f} className={`fs-filter-pill ${filter === f ? "fs-filter-pill--active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
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
                <div className="fs-batch-card__id">{b.id} · Planted {b.planted}</div>
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
      {showEditModal && editBatch && (
        <EditBatchModal
          batch={editBatch}
          onClose={() => setShowEditModal(false)}
          onSubmit={updateBatch}
        />
      )}
      {showDeleteModal && (
        <DeleteBatchModal
          batchId={deleteBatchId}
          onClose={() => setShowDeleteModal(false)}
          onDelete={deleteBatch}
        />
      )}
    </>
  );
}
function EditBatchModal({ batch, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    crop: batch.crop,
    location: batch.location,
    planted: batch.planted.split(' ')[0], // Extract YYYY-MM-DD
    notes: batch.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(batch.id, formData);
      toast.success('Batch updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update batch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: 'var(--charcoal)' }}>Edit Batch</h2>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>Update {batch.id}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--charcoal)' }}>Crop Name</label>
              <input
                name="crop"
                value={formData.crop}
                onChange={handleChange}
                className="fs-search-input"
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--charcoal)' }}>Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="fs-search-input"
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--charcoal)' }}>Planted Date</label>
              <input
                type="date"
                name="planted"
                value={formData.planted}
                onChange={handleChange}
                className="fs-search-input"
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--charcoal)' }}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="fs-search-input"
                style={{ resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }}
                disabled={submitting}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid var(--border)',
                background: 'var(--cream2)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--charcoal)'
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: 'var(--gold)',
                color: 'var(--charcoal)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Update Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteBatchModal({ batchId, onClose, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    setConfirming(true);
    try {
      await onDelete(batchId);
      toast.success('Batch deleted successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to delete batch.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '32px 24px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--red)' }}>🗑️</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: 'var(--charcoal)' }}>Delete Batch</h2>
          <p style={{ color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to delete this batch? This action cannot be undone.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '0 24px 24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border)',
              background: 'var(--cream2)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--charcoal)',
              flex: 1
            }}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 20px',
              background: 'var(--red)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: confirming ? 'not-allowed' : 'pointer',
              flex: 1
            }}
            disabled={confirming}
          >
            {confirming ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PAGE: ATMOSPHERE
// ═══════════════════════════════════════════════

function AtmospherePage() {
  const [heatType, setHeatType] = useState("Temperature");

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Live Atmospheric Data · Updated 4 min ago</div>
          <h1 className="fs-page-title">Atmosphere <em>Monitor</em></h1>
          <p className="fs-page-sub">Temperature, humidity, and wind across all farm blocks · Spray window guidance included</p>
        </div>
      </div>

      <TopbarAtmosphere />
      <br />


      <div className="bg-card rounded-xl border border-border overflow-hidden h-[350px] mt-10">
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=116.00,5.90,116.20,6.10&layer=mapnik"
          className="w-full h-full border-0"
          title="Map of Sabah monitoring locations"
        />
      </div>

      <br />

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--red"><div className="fs-stat-card__label">Max Temp (Block A)</div><div className="fs-stat-card__val fs-stat-card__val--danger">35°C</div><div className="fs-stat-card__meta">Stress threshold &gt;33°C</div><span className="fs-stat-tag fs-stat-tag--danger">High</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Avg Humidity</div><div className="fs-stat-card__val fs-stat-card__val--warn">66%</div><div className="fs-stat-card__meta">Optimal 60–75%</div><span className="fs-stat-tag fs-stat-tag--warn">Monitor</span></div>
        <div className="fs-stat-card fs-stat-card--blue"><div className="fs-stat-card__label">Wind Speed</div><div className="fs-stat-card__val fs-stat-card__val--blue">12</div><div className="fs-stat-card__meta">km/h · Direction NE</div><span className="fs-stat-tag fs-stat-tag--blue">Moderate</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Spray Windows Today</div><div className="fs-stat-card__val">2</div><div className="fs-stat-card__meta">Safe windows available</div><span className="fs-stat-tag fs-stat-tag--good">Next: 17:30</span></div>
      </div>

      <div className="fs-grid-2" style={{ alignItems: "start" }}>
        <div className="fs-card">
          <div className="fs-card__header">
            <div><div className="fs-card__title">{heatType} Heat Map</div><div className="fs-card__sub">All farm blocks · Live readings</div></div>
          </div>
          <div className="fs-card__body">
            <div className="fs-heatmap-grid">
              {HEATMAP_DATA.map((cell, i) => (
                <div key={i} className="fs-heatmap-cell" style={{ background: cell.bg }} title={`${cell.temp}°C`}>
                  <span className="fs-heatmap-cell__label">{cell.temp}°</span>
                </div>
              ))}
            </div>
            <div className="fs-heatmap-legend">
              <span className="fs-heatmap-legend__label">Cool</span>
              <div className="fs-heatmap-legend__bar" />
              <span className="fs-heatmap-legend__label">Hot</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="fs-suggestion">
                <div className="fs-suggestion__label">AI Atmospheric Insight</div>
                Heat concentration in Blocks A1–A2 is at stress-inducing levels. Combined with low soil moisture (42%), risk of further blight spread is elevated. Consider emergency irrigation and shade netting for Block A.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="fs-card">
            <div className="fs-card__header"><div><div className="fs-card__title">5-Day Weather Forecast</div><div className="fs-card__sub">Kota Kinabalu · FARM-KK-001</div></div></div>
            <div className="fs-card__body">
              <div className="fs-weather-strip">
                {WEATHER.map(w => (
                  <div key={w.day} className={`fs-weather-day${w.today ? " fs-weather-day--today" : ""}`}>
                    <div className="fs-weather-day__name">{w.day}</div>
                    <span className="fs-weather-day__icon">{w.icon}</span>
                    <div className="fs-weather-day__temp">{w.temp}</div>
                    <div className="fs-weather-day__rain">🌧 {w.rain}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(212,133,26,0.08)", borderRadius: 9, border: "1px solid rgba(212,133,26,0.25)", fontSize: "0.77rem", color: "var(--dark)" }}>
                <strong style={{ color: "var(--amber)" }}>⚠ Rain alert Monday:</strong> 80% chance of heavy rain. Avoid fungicide application Sunday afternoon — active ingredients will wash off.
              </div>
            </div>
          </div>

          <div className="fs-card">
            <div className="fs-card__header"><div><div className="fs-card__title">Today's Spray Windows</div><div className="fs-card__sub">Based on wind, temp &amp; rain forecast</div></div></div>
            <div className="fs-card__body">
              {SPRAY_WINDOWS.map((w, i) => (
                <div key={i} className="fs-spray-window">
                  <div className={`fs-spray-dot fs-spray-dot--${w.dot}`} />
                  <div className="fs-spray-time">{w.time}</div>
                  <div className="fs-spray-desc">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// PAGE: SOIL HEALTH
// ═══════════════════════════════════════════════

function SoilPage() {
  const avgScore = Math.round(SOIL_BLOCKS.reduce((s, b) => s + b.score, 0) / SOIL_BLOCKS.length);
  const gradeLabel = { great: "Excellent", ok: "Moderate", poor: "Poor" };

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Soil Sensor Data · Synced 4 min ago</div>
          <h1 className="fs-page-title">Soil <em>Health</em></h1>
          <p className="fs-page-sub">Moisture, pH, and nutrient levels across all 6 active blocks</p>
        </div>
      </div>

      <TopbarSoilHealth />

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Farm Avg. Soil Score</div><div className="fs-stat-card__val">{avgScore}</div><div className="fs-stat-card__meta">Out of 100</div><span className="fs-stat-tag fs-stat-tag--warn">Needs work</span></div>
        <div className="fs-stat-card fs-stat-card--red"><div className="fs-stat-card__label">Critical Blocks</div><div className="fs-stat-card__val fs-stat-card__val--danger">1</div><div className="fs-stat-card__meta">Block A below threshold</div><span className="fs-stat-tag fs-stat-tag--danger">Act now</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Avg. Soil Moisture</div><div className="fs-stat-card__val fs-stat-card__val--warn">61%</div><div className="fs-stat-card__meta">2 blocks below optimal</div><span className="fs-stat-tag fs-stat-tag--warn">Low</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Optimal Blocks</div><div className="fs-stat-card__val">3</div><div className="fs-stat-card__meta">Score &gt; 80</div><span className="fs-stat-tag fs-stat-tag--good">Healthy</span></div>
      </div>

      <div className="fs-section-row">
        <div className="fs-section-label">Block-by-Block Soil Analysis</div>
        <div>
          <button className="fs-btn fs-btn--ghost fs-btn--sm">⬇ Export Report</button>
        </div>
      </div>

      <div className="fs-soil-block-grid">
        {SOIL_BLOCKS.map((blk, i) => (
          <div key={blk.id} className={`fs-soil-block${blk.grade === "poor" ? " fs-soil-block--danger" : blk.grade === "ok" ? " fs-soil-block--warn" : ""}`} style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
            <div className="fs-soil-block__header">
              <div>
                <div className="fs-soil-block__name">{blk.crop}</div>
                <div className="fs-soil-block__loc">📍 {blk.loc}</div>
              </div>
              <span className={`fs-pill ${blk.grade === "great" ? "fs-pill--healthy" : blk.grade === "ok" ? "fs-pill--warning" : "fs-pill--danger"}`}>{gradeLabel[blk.grade]}</span>
            </div>
            <div className="fs-soil-score">
              <div className={`fs-soil-score__ring fs-soil-score__ring--${blk.grade}`}>{blk.score}</div>
              <div className="fs-soil-score__label">Soil Health Score</div>
            </div>
            <div className="fs-soil-metrics">
              {blk.metrics.map(m => (
                <div key={m.name} className="fs-soil-metric">
                  <div className="fs-soil-metric__name">{m.name}</div>
                  <div className={`fs-soil-metric__val fs-soil-metric__val--${m.state}`}>{m.val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              {blk.bars.map(bar => (
                <div key={bar.name} className="fs-progress-bar-wrap">
                  <div className="fs-progress-label"><span>{bar.name}</span><span>{bar.pct}%</span></div>
                  <div className="fs-progress-bar"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fs-card">
        <div className="fs-card__header"><div><div className="fs-card__title">AI Soil Recommendations</div><div className="fs-card__sub">Priority actions based on current readings</div></div></div>
        <div className="fs-card__body">
          <div className="fs-grid-2" style={{ marginBottom: 0 }}>
            <div className="fs-suggestion"><div className="fs-suggestion__label">Block A — Critical</div>Immediately irrigate to raise moisture above 55%. Apply nitrogen-rich organic fertiliser (compost or blood meal). Re-test pH and add agricultural lime if below 6.0. Re-scan in 48 hours.</div>
            <div className="fs-suggestion"><div className="fs-suggestion__label">Block B — Moderate</div>Increase irrigation frequency by 15%. Side-dress with balanced NPK. Organic matter levels suggest need for compost application before next planting cycle.</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// PAGE: DISEASE MAP
// ═══════════════════════════════════════════════

function DiseaseMapPage() {
  const [timeSlider, setTimeSlider] = useState(100);
  const blockCls = { healthy: "fs-map-block--healthy", warning: "fs-map-block--warning", danger: "fs-map-block--danger", empty: "fs-map-block--empty" };

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Pest &amp; Disease Spread Tracker</div>
          <h1 className="fs-page-title">Disease <em>Movement</em> Map</h1>
          <p className="fs-page-sub">Track spread vectors across all blocks · Use timeline to review historical movement</p>
        </div>
      </div>

      <TopbarDiseaseMap />

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--red"><div className="fs-stat-card__label">Active Threats</div><div className="fs-stat-card__val fs-stat-card__val--danger">2</div><div className="fs-stat-card__meta">Spreading across blocks</div><span className="fs-stat-tag fs-stat-tag--danger">High risk</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Blocks at Risk</div><div className="fs-stat-card__val fs-stat-card__val--warn">4</div><div className="fs-stat-card__meta">Within spread radius</div><span className="fs-stat-tag fs-stat-tag--warn">Monitor</span></div>
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Spread Velocity</div><div className="fs-stat-card__val">1.2</div><div className="fs-stat-card__meta">Blocks/day (Early Blight)</div><span className="fs-stat-tag fs-stat-tag--warn">Increasing</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Resolved Threats</div><div className="fs-stat-card__val">1</div><div className="fs-stat-card__meta">Whitefly — Block D</div><span className="fs-stat-tag fs-stat-tag--good">Treated</span></div>
      </div>

      <div className="fs-grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="fs-section-row">
            <div></div>
            <div>
              <button className="fs-btn fs-btn--ghost fs-btn--sm">⬇ Export Map</button>
            </div>
          </div>
          <div className="fs-card" style={{ marginBottom: 18 }}>
            <div className="fs-card__header"><div><div className="fs-card__title">Farm Block Map</div><div className="fs-card__sub">Hover blocks for detail · Pulsing = active threat</div></div></div>
            <div className="fs-farm-map">
              <div className="fs-map-grid">
                {MAP_BLOCKS.map(blk => (
                  <div key={blk.id} className={`fs-map-block ${blockCls[blk.status]}`} title={`${blk.label}: ${blk.name || "Empty"}`}>
                    <div className="fs-map-block__label">{blk.label}</div>
                    {blk.crop && <div className="fs-map-block__crop">{blk.crop}</div>}
                    <div className="fs-map-block__status">{blk.status !== "empty" ? blk.status : "–"}</div>
                  </div>
                ))}
              </div>
              <div className="fs-map-legend">
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--red)" }} />Critical</div>
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--amber)" }} />Warning</div>
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--green-lt)" }} />Healthy</div>
                <div className="fs-map-legend__item"><div className="fs-map-legend__dot" style={{ background: "var(--cream3)" }} />Unplanted</div>
              </div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div className="fs-time-slider">
                <label>Timeline <span>{timeSlider}% — {timeSlider === 100 ? "Now (Live)" : `${Math.round((100 - timeSlider) / 10)} days ago`}</span></label>
                <input type="range" min={0} max={100} value={timeSlider} onChange={e => setTimeSlider(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="fs-card">
            <div className="fs-card__header"><div><div className="fs-card__title">Spread Prediction</div><div className="fs-card__sub">AI risk forecast — next 72 hours</div></div></div>
            <div className="fs-card__body">
              <div className="fs-suggestion">
                <div className="fs-suggestion__label">AI Spread Forecast</div>
                At current velocity and NE wind direction (12 km/h), Early Blight from Block A1–A2 has a <strong>73% probability</strong> of reaching Block B1 within 48 hours. Immediate fungicide treatment on Blocks A1, A2, and prophylactic spray on B1 strongly recommended.
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[{ block: "A1", risk: "Critical", col: "var(--red)" }, { block: "A2", risk: "Critical", col: "var(--red)" }, { block: "B1", risk: "High risk", col: "var(--amber)" }, { block: "A3", risk: "Watch", col: "var(--amber)" }].map(r => (
                  <div key={r.block} style={{ background: r.col + "18", border: `1px solid ${r.col}44`, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1rem" }}>{r.block}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: r.col }}>{r.risk}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="fs-section-row" style={{ marginTop: 20 }}><div className="fs-section-label">Active Threat Log</div></div>
          {THREAT_LOG.map((t, i) => (
            <div key={i} className={`fs-threat-entry${t.type === "danger" ? " fs-threat-entry--danger" : t.type === "warn" ? " fs-threat-entry--warn" : ""}`}>
              <span className="fs-threat-entry__icon">{t.icon}</span>
              <div>
                <div className="fs-threat-entry__title">{t.title}</div>
                <div className="fs-threat-entry__desc">{t.desc}</div>
                <div className="fs-threat-entry__meta">{t.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// PAGE: CROP PROFILES
// ═══════════════════════════════════════════════

function CropProfilesPage() {
  const [selected, setSelected] = useState(null);
  const [vals, setVals] = useState({ moisture: 70, temp: 26, humidity: 65, ph: 64 });
  const profile = selected ? CROP_PROFILES.find(p => p.id === selected) : null;

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Custom Crop Configuration</div>
          <h1 className="fs-page-title">Crop <em>Profiles</em></h1>
          <p className="fs-page-sub">Set your own target ranges per crop — AI will alert based on your thresholds, not generic defaults</p>
        </div>
      </div>

      <TopbarCropProfile />


      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Active Profiles</div><div className="fs-stat-card__val">{CROP_PROFILES.length}</div><div className="fs-stat-card__meta">Custom Profile</div><span className="fs-stat-tag fs-stat-tag--good">All active</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Batches Covered</div><div className="fs-stat-card__val">6</div><div className="fs-stat-card__meta">All batches assigned</div><span className="fs-stat-tag fs-stat-tag--good">Complete</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Custom Alerts</div><div className="fs-stat-card__val fs-stat-card__val--warn">4</div><div className="fs-stat-card__meta">Profile-based triggers</div><span className="fs-stat-tag fs-stat-tag--warn">Active</span></div>
        <div className="fs-stat-card fs-stat-card--purple"><div className="fs-stat-card__label">AI Optimisations</div><div className="fs-stat-card__val">12</div><div className="fs-stat-card__meta">Suggested adjustments</div><span className="fs-stat-tag fs-stat-tag--good">Review</span></div>
      </div>

      <div className="fs-grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="fs-section-row"><div className="fs-section-label">My Crop Profile</div>
            <div>
              <button className="fs-btn fs-btn--gold fs-btn--sm">+ New Profile</button>
            </div></div>
          <div className="fs-profile-grid" style={{ gridTemplateColumns: "1fr" }}>
            {CROP_PROFILES.map((p, i) => (
              <div key={p.id} className={`fs-profile-card${selected === p.id ? " " : " "}`} style={{ animationDelay: `${0.05 + i * 0.07}s`, outline: selected === p.id ? `2px solid var(--gold)` : "none", outlineOffset: 2 }} onClick={() => setSelected(selected === p.id ? null : p.id)}>
                <div className="fs-profile-card__top">
                  <span className="fs-profile-card__emoji">{p.emoji}</span>
                  <div>
                    <div className="fs-profile-card__name">{p.name}</div>
                    <div className="fs-profile-card__type">{p.type}</div>
                  </div>
                  <span className="fs-pill fs-pill--healthy" style={{ marginLeft: "auto" }}>Active</span>
                </div>
                <div className="fs-profile-card__body">
                  <div className="fs-recipe-params">
                    {p.params.map(param => (
                      <div key={param.name}>
                        <div className="fs-recipe-param__row">
                          <span className="fs-recipe-param__name">{param.name}</span>
                          <span className="fs-recipe-param__val">{param.min}–{param.max}{param.unit}</span>
                        </div>
                        <div className="fs-recipe-param__bar">
                          <div style={{ left: `${param.min * 0.7}%`, width: `${(param.max - param.min) * 0.7}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fs-profile-card__footer">
                  <div className="fs-profile-card__assigned">Assigned to <strong>{p.assignedTo}</strong></div>
                  <button className="fs-btn fs-btn--ghost fs-btn--sm" onClick={e => { e.stopPropagation(); setSelected(p.id); }}>Edit Crop Profile</button>
                </div>
              </div>
            ))}
            <div className="fs-profile-card fs-profile-card--add" onClick={() => alert("New profile wizard — set crop type, target ranges, and alert thresholds.")}>
              <span style={{ fontSize: "1.8rem" }}>+</span>
              <span>Create New Crop Profile</span>
            </div>
          </div>
        </div>

        <div>
          {profile ? (
            <div className="fs-recipe-editor">
              <div className="fs-recipe-editor__title">{profile.emoji} {profile.name}</div>
              <div className="fs-recipe-editor__sub">Adjust target ranges — AI alerts trigger when readings fall outside these bounds</div>
              <div className="fs-recipe-editor__grid">
                <div className="fs-range-row">
                  <label>Soil Moisture (%) <span>{vals.moisture}%</span></label>
                  <input type="range" min={30} max={95} value={vals.moisture} onChange={e => setVals(v => ({ ...v, moisture: +e.target.value }))} />
                </div>
                <div className="fs-range-row">
                  <label>Temperature (°C) <span>{vals.temp}°C</span></label>
                  <input type="range" min={15} max={40} value={vals.temp} onChange={e => setVals(v => ({ ...v, temp: +e.target.value }))} />
                </div>
                <div className="fs-range-row">
                  <label>Humidity (%) <span>{vals.humidity}%</span></label>
                  <input type="range" min={30} max={95} value={vals.humidity} onChange={e => setVals(v => ({ ...v, humidity: +e.target.value }))} />
                </div>
                <div className="fs-range-row">
                  <label>Soil pH <span>{(vals.ph / 10).toFixed(1)}</span></label>
                  <input type="range" min={40} max={80} value={vals.ph} onChange={e => setVals(v => ({ ...v, ph: +e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Alert Condition</div>
                <div style={{ background: "var(--cream2)", borderRadius: 8, padding: "10px 12px", fontSize: "0.77rem", color: "var(--dark)", border: "1px solid var(--border)" }}>{profile.alert}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Farmer Notes / Custom Recipe</div>
                <textarea className="fs-textarea" rows={3} defaultValue={profile.notes} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="fs-btn fs-btn--gold" style={{ flex: 1, justifyContent: "center" }}>Save Profile</button>
                <button className="fs-btn fs-btn--ghost" onClick={() => setSelected(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="fs-card">
              <div className="fs-card__body" style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🌱</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>Select a profile to edit</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 1.6 }}>Click any crop profile on the left to open the recipe editor and customise your target thresholds and alert conditions.</div>
              </div>
            </div>
          )}

          {profile && (
            <div className="fs-card" style={{ marginTop: 18 }}>
              <div className="fs-card__header"><div><div className="fs-card__title">AI Profile Suggestions</div><div className="fs-card__sub">Based on your current readings &amp; crop type</div></div></div>
              <div className="fs-card__body">
                <div className="fs-suggestion" style={{ marginBottom: 10 }}><div className="fs-suggestion__label">Optimisation</div>Your moisture threshold (current: {vals.moisture}%) is slightly high for {profile.name}. Research suggests {profile.params[0].min}–{profile.params[0].max}% reduces fungal risk without stress.</div>
                <div className="fs-suggestion"><div className="fs-suggestion__label">Seasonal Adjustment</div>March–April is peak humidity season in Kota Kinabalu. Consider lowering your humidity alert threshold to 70% to get earlier warnings before fungal conditions develop.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// SIDEBAR + APP SHELL
// ═══════════════════════════════════════════════

const NAV_ITEMS = [
  { page: "Dashboard", icon: "🏠", label: "Dashboard", section: "Main" },
  { page: "Atmosphere", icon: "🌤️", label: "Atmosphere", section: "Monitoring" },
  { page: "Soil Health", icon: "🪱", label: "Soil Health", section: "Monitoring" },
  { page: "Disease Map", icon: "🗺️", label: "Disease Map", section: "Monitoring" },
  { page: "Crop Profiles", icon: "🌱", label: "Crop Profiles", section: "Configuration" },
];

export default function FarmSenseApp() {
  const [activePage, setActivePage] = useState("Dashboard");
  const alertCount = INITIAL_BATCHES.filter(b => b.status !== "healthy").length;

  let sections = [];
  NAV_ITEMS.forEach(item => {
    if (!sections.find(s => s.label === item.section)) sections.push({ label: item.section });
    sections[sections.length - 1].items = [...(sections[sections.length - 1].items || []), item];
  });
  const grouped = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const PAGE_COMPONENTS = {
    "Dashboard": <DashboardPage />,
    "Atmosphere": <AtmospherePage />,
    "Soil Health": <SoilPage />,
    "Disease Map": <DiseaseMapPage />,
    "Crop Profiles": <CropProfilesPage />,
  };

  return (
    <div className="fs-app">
      {/* SIDEBAR */}
      <aside className="fs-sidebar">
        <div className="fs-sidebar__brand">
          <div className="fs-sidebar__logo">🌿</div>
          <div className="fs-sidebar__name"><span>Ai</span> Farm</div>
        </div>
        <div className="fs-sidebar__farm">
          <div className="fs-sidebar__farm-label">Active Farm</div>
          <div className="fs-sidebar__farm-name">Kota Kinabalu · KK-001</div>
        </div>
        <nav className="fs-sidebar__nav">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="fs-sidebar__section-label">{section}</div>
              {items.map(item => (
                <button
                  key={item.page}
                  className={`fs-nav-item${activePage === item.page ? " fs-nav-item--active" : ""}`}
                  onClick={() => setActivePage(item.page)}
                >
                  <span className="fs-nav-item__icon">{item.icon}</span>
                  <span className="fs-nav-item__label">{item.label}</span>
                  {item.page === "Dashboard" && alertCount > 0 && (
                    <span className="fs-nav-item__badge">{alertCount}</span>
                  )}
                  {item.page === "Disease Map" && (
                    <span className="fs-nav-item__badge">2</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div>
          <button
            className="fs-nav-item fs-sidebar__logout"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="fs-nav-item__icon">🚪</span>
            <span className="fs-nav-item__label">Logout</span>
          </button>
        </div>
        <div className="fs-sidebar__footer">
          <div className="fs-sidebar__avatar">JD</div>
          <div>
            <div className="fs-sidebar__user-name">John Doe</div>
            <div className="fs-sidebar__user-role">Farm Manager</div>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="fs-content">
        <div className="fs-page">
          {PAGE_COMPONENTS[activePage]}
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const RegisterBatchModalStyle = {
  overlay: {
    backgroundColor: 'rgba(28, 31, 22, 0.85)', // Using your Sidebar bg color with alpha
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000
  },
  modal: {
    backgroundColor: '#f0ece4', // Content bg
    borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  title: { color: '#1c1f16', margin: '4px 0', fontSize: '1.5rem' },
  subtitle: { color: '#7a7060', fontSize: '0.9rem', marginBottom: '24px' },
  group: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label: {
    color: '#1c1f16', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left'
  },
  input: {
    padding: '12px', borderRadius: '8px', border: '1px solid #7a7060',
    backgroundColor: '#fff', fontSize: '0.95rem', outline: 'none'
  },
  footer: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' },
  cancelBtn: {
    padding: '12px 20px', border: 'none', background: 'transparent',
    color: '#7a7060', cursor: 'pointer', fontWeight: '500'
  },
  submitBtn: {
    padding: '12px 24px', borderRadius: '8px', border: 'none',
    backgroundColor: '#c8973a', color: '#fff', fontWeight: 'bold',
    transition: 'all 0.2s'
  }
};