import { useState, useRef } from "react";
import "./farmsense.css";

// ─── DATA ────────────────────────────────────────────────────────────────────

const BATCHES = [
  {
    id: "BATCH-001", crop: "🍅 Tomatoes", location: "Block A · Row 1–12",
    planted: "12 Jan 2026", status: "danger",
    sensors: [
      { icon: "🌡️", name: "Temp", val: "34°C", state: "warn" },
      { icon: "💧", name: "Moisture", val: "42%", state: "bad" },
      { icon: "🌤️", name: "Humidity", val: "68%", state: "ok" },
      { icon: "⚗️", name: "pH", val: "5.8", state: "warn" },
    ],
    aiDetection: "Early Blight (Alternaria solani)",
    aiConf: "Confidence: 91% · Last scan: 2h ago",
    suggestion: "Apply copper-based fungicide within 24 hours. Remove affected lower leaves. Increase irrigation to raise soil moisture above 60% and improve air circulation.",
    lastScan: "Today 08:42 AM",
  },
  {
    id: "BATCH-002", crop: "🥬 Lettuce", location: "Block B · Row 1–8",
    planted: "20 Jan 2026", status: "warning",
    sensors: [
      { icon: "🌡️", name: "Temp", val: "26°C", state: "ok" },
      { icon: "💧", name: "Moisture", val: "58%", state: "warn" },
      { icon: "🌤️", name: "Humidity", val: "72%", state: "ok" },
      { icon: "⚗️", name: "pH", val: "6.4", state: "ok" },
    ],
    aiDetection: "Aphid Presence — Low Density",
    aiConf: "Confidence: 78% · Last scan: 5h ago",
    suggestion: "Monitor daily. Consider neem oil spray as preventive measure. Check undersides of leaves. No immediate chemical treatment required at this density.",
    lastScan: "Today 05:15 AM",
  },
  {
    id: "BATCH-003", crop: "🫑 Bell Peppers", location: "Block C · Row 3–10",
    planted: "5 Jan 2026", status: "healthy",
    sensors: [
      { icon: "🌡️", name: "Temp", val: "28°C", state: "ok" },
      { icon: "💧", name: "Moisture", val: "70%", state: "ok" },
      { icon: "🌤️", name: "Humidity", val: "65%", state: "ok" },
      { icon: "⚗️", name: "pH", val: "6.8", state: "ok" },
    ],
    aiDetection: "No Disease or Pest Detected",
    aiConf: "Confidence: 97% · Last scan: 1h ago",
    suggestion: "Crop is in excellent condition. Maintain current irrigation. Consider balanced NPK fertiliser next week as plants approach fruiting stage.",
    lastScan: "Today 09:05 AM",
  },
  {
    id: "BATCH-004", crop: "🥒 Cucumber", location: "Block D · Row 1–6",
    planted: "18 Jan 2026", status: "healthy",
    sensors: [
      { icon: "🌡️", name: "Temp", val: "27°C", state: "ok" },
      { icon: "💧", name: "Moisture", val: "74%", state: "ok" },
      { icon: "🌤️", name: "Humidity", val: "70%", state: "ok" },
      { icon: "⚗️", name: "pH", val: "6.5", state: "ok" },
    ],
    aiDetection: "No Disease or Pest Detected",
    aiConf: "Confidence: 94% · Last scan: 3h ago",
    suggestion: "Growth rate is on target. Ensure trellis support is secure as vines develop. Soil moisture is optimal — continue current drip irrigation timing.",
    lastScan: "Today 07:20 AM",
  },
  {
    id: "BATCH-005", crop: "🍓 Strawberries", location: "Block E · Row 1–4",
    planted: "2 Feb 2026", status: "healthy",
    sensors: [
      { icon: "🌡️", name: "Temp", val: "24°C", state: "ok" },
      { icon: "💧", name: "Moisture", val: "68%", state: "ok" },
      { icon: "🌤️", name: "Humidity", val: "62%", state: "ok" },
      { icon: "⚗️", name: "pH", val: "5.9", state: "ok" },
    ],
    aiDetection: "No Disease or Pest Detected",
    aiConf: "Confidence: 95% · Last scan: 2h ago",
    suggestion: "Plants are in flowering stage. Avoid wetting foliage to reduce botrytis risk. Pollinator activity observed — conditions are ideal for fruit set.",
    lastScan: "Today 08:00 AM",
  },
  {
    id: "BATCH-006", crop: "🫛 Long Beans", location: "Block F · Row 1–10",
    planted: "25 Jan 2026", status: "healthy",
    sensors: [
      { icon: "🌡️", name: "Temp", val: "29°C", state: "ok" },
      { icon: "💧", name: "Moisture", val: "66%", state: "ok" },
      { icon: "🌤️", name: "Humidity", val: "67%", state: "ok" },
      { icon: "⚗️", name: "pH", val: "6.2", state: "ok" },
    ],
    aiDetection: "No Disease or Pest Detected",
    aiConf: "Confidence: 92% · Last scan: 4h ago",
    suggestion: "Healthy growth observed. Potassium supplement recommended in 2 weeks to support pod development. Next scan at sunrise tomorrow.",
    lastScan: "Today 06:45 AM",
  },
];

const AI_RESULTS = {
  healthy: {
    icon: "✅", title: "No Disease or Pest Detected",
    conf: "Confidence: 95% · Plant appears healthy",
    detail: "No visible signs of disease, pest infestation, or nutritional deficiency detected. Leaf colour, texture, and structure are within normal parameters for this crop growth stage.",
    sugs: [
      "Maintain current irrigation and fertilisation schedule",
      "Schedule next scan in 48–72 hours for routine monitoring",
      "Document current healthy baseline for trend comparison",
    ],
  },
  aphid: {
    icon: "🔎", title: "Aphid Infestation — Early Stage",
    conf: "Confidence: 82% · Aphis gossypii",
    detail: "Small colonies of aphids detected on undersides of younger leaves. Colony density is currently low. Early intervention will prevent rapid population growth and virus transmission risk.",
    sugs: [
      "Apply neem oil spray (2% solution) in the early morning or evening",
      "Introduce or encourage natural predators such as ladybugs",
      "Avoid high-nitrogen fertiliser which promotes the soft leaf growth aphids prefer",
      "Re-scan in 72 hours to assess population response",
    ],
  },
  blight: {
    icon: "⚠️", title: "Early Blight Detected",
    conf: "Confidence: 91% · Alternaria solani",
    detail: "Characteristic concentric ring lesions observed on lower leaves. Affected area covers approximately 15% of sampled foliage. Condition is in early stage — treatment will be effective if applied promptly.",
    sugs: [
      "Apply copper-based fungicide (e.g. Bordeaux mixture) within 24 hours",
      "Remove and dispose of visibly affected leaves — do not compost",
      "Increase irrigation to raise soil moisture above 60%",
      "Re-scan in 48 hours to monitor treatment effectiveness",
    ],
  },
};

const PROC_STEPS = [
  "Extracting visual features...",
  "Checking disease patterns...",
  "Cross-referencing pest database...",
  "Generating recommendations...",
  "Finalising analysis...",
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Navbar({ alertCount }) {
  const [active, setActive] = useState("Dashboard");
  const links = ["Dashboard", "Batches", "Sensors", "Reports", "Settings"];
  return (
    <nav className="fs-nav">
      <div className="fs-nav__brand">
        <div className="fs-nav__logo">🌿</div>
        <div className="fs-nav__title">Ai<span>Farm</span></div>
      </div>
      <div className="fs-nav__links">
        {links.map((l) => (
          <button
            key={l}
            className={`fs-nav__link ${active === l ? "fs-nav__link--active" : ""}`}
            onClick={() => setActive(l)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="fs-nav__right">
        {alertCount > 0 && (
          <span className="fs-nav__alert-badge">{alertCount} Alert{alertCount > 1 ? "s" : ""}</span>
        )}
        <span className="fs-nav__farm-id">FARM-KK-001</span>
        <div className="fs-nav__avatar">JD</div>
      </div>
    </nav>
  );
}

function StatStrip() {
  return (
    <div className="fs-stat-strip">
      <div className="fs-stat-card fs-stat-card--gold">
        <div className="fs-stat-card__label">Active Batches</div>
        <div className="fs-stat-card__val">6</div>
        <div className="fs-stat-card__meta">Vegetables &amp; Fruits</div>
        <span className="fs-stat-tag fs-stat-tag--good">All registered</span>
      </div>
      <div className="fs-stat-card fs-stat-card--red">
        <div className="fs-stat-card__label">Alerts</div>
        <div className="fs-stat-card__val fs-stat-card__val--danger">2</div>
        <div className="fs-stat-card__meta">Requires attention</div>
        <span className="fs-stat-tag fs-stat-tag--danger">Critical</span>
      </div>
      <div className="fs-stat-card fs-stat-card--amber">
        <div className="fs-stat-card__label">Avg. Soil Moisture</div>
        <div className="fs-stat-card__val fs-stat-card__val--warn">61%</div>
        <div className="fs-stat-card__meta">Optimal 65–75%</div>
        <span className="fs-stat-tag fs-stat-tag--warn">Low</span>
      </div>
      <div className="fs-stat-card fs-stat-card--green">
        <div className="fs-stat-card__label">Healthy Batches</div>
        <div className="fs-stat-card__val">4</div>
        <div className="fs-stat-card__meta">No issues detected</div>
        <span className="fs-stat-tag fs-stat-tag--good">On track</span>
      </div>
    </div>
  );
}

function SensorMini({ icon, name, val, state }) {
  return (
    <div className="fs-sensor-mini">
      <span className="fs-sensor-mini__icon">{icon}</span>
      <span className="fs-sensor-mini__name">{name}</span>
      <span className={`fs-sensor-mini__val fs-sensor-mini__val--${state}`}>{val}</span>
    </div>
  );
}

function BatchCard({ batch, onScan, onQR, delay }) {
  const statusLabel = { healthy: "✓ Healthy", warning: "⚡ Warning", danger: "⚠ Critical" };
  const aiBoxClass = { healthy: "", warning: "fs-ai-box--warn", danger: "fs-ai-box--alert" };

  return (
    <div
      className={`fs-batch-card ${batch.status === "danger" ? "fs-batch-card--danger" : batch.status === "warning" ? "fs-batch-card--warn" : ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`fs-batch-card__bar fs-batch-card__bar--${batch.status === "danger" ? "danger" : batch.status === "warning" ? "warning" : "healthy"}`} />
      <div className="fs-batch-card__header">
        <div>
          <div className="fs-batch-card__crop">{batch.crop}</div>
          <div className="fs-batch-card__loc">📍 {batch.location}</div>
          <div className="fs-batch-card__id">{batch.id} · Planted {batch.planted}</div>
        </div>
        <span className={`fs-status-pill fs-status-pill--${batch.status}`}>
          {statusLabel[batch.status]}
        </span>
      </div>
      <div className="fs-batch-card__body">
        <div className="fs-sensor-row">
          {batch.sensors.map((s) => (
            <SensorMini key={s.name} {...s} />
          ))}
        </div>
        <div className={`fs-ai-box ${aiBoxClass[batch.status]}`}>
          <span className="fs-ai-box__emoji">🔍</span>
          <div>
            <div className="fs-ai-box__tag">AI Camera Vision</div>
            <div className="fs-ai-box__result">{batch.aiDetection}</div>
            <div className="fs-ai-box__conf">{batch.aiConf}</div>
          </div>
        </div>
        <div className="fs-suggestion">
          <div className="fs-suggestion__label">AI Recommendation</div>
          {batch.suggestion}
        </div>
        <div className="fs-batch-actions">
          <button className="fs-btn-scan" onClick={() => onScan(batch)}>
            <span className="fs-btn-scan__dot">◉</span> Scan with Camera
          </button>
          <button className="fs-btn-qr" onClick={() => onQR(batch)} title="Show QR Code">▦</button>
        </div>
        <div className="fs-batch-card__last-scan">Last scan: {batch.lastScan}</div>
      </div>
    </div>
  );
}

function QRModal({ batch, onClose }) {
  if (!batch) return null;
  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fs-qr-modal__eyebrow">Batch QR Code</div>
        <div className="fs-qr-modal__title">{batch.crop}</div>
        <div className="fs-qr-modal__sub">Scan to link your phone camera to this batch</div>
        <div className="fs-qr-modal__code-box">▦</div>
        <div className="fs-qr-modal__batch-id">{batch.id}</div>
        <p className="fs-qr-modal__info">
          Print and attach to row marker. All camera scans will be automatically attributed to{" "}
          <strong>{batch.crop}</strong> — no manual entry needed.
        </p>
        <button className="fs-btn-modal-close" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function ScanModal({ batch, onClose }) {
  const [phase, setPhase] = useState("upload"); // upload | processing | result
  const [procStep, setProcStep] = useState(PROC_STEPS[0]);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  if (!batch) return null;

  const handleFileChange = () => {
    setPhase("processing");
    let i = 0;
    const iv = setInterval(() => {
      if (i < PROC_STEPS.length) {
        setProcStep(PROC_STEPS[i++]);
      } else {
        clearInterval(iv);
        const keys = Object.keys(AI_RESULTS);
        setResult(AI_RESULTS[keys[Math.floor(Math.random() * keys.length)]]);
        setPhase("result");
      }
    }, 850);
  };

  return (
    <div className="fs-modal-overlay" onClick={onClose}>
      <div className="fs-scan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fs-scan-modal__top">
          <div className="fs-scan-modal__eyebrow">AI Camera Vision</div>
          <div className="fs-scan-modal__title">
            Scanning: <span>{batch.crop}</span>
          </div>
          <div className="fs-scan-modal__sub">{batch.id} · Point camera at leaves or stems</div>
        </div>
        <div className="fs-camera-view">
          <span className="fs-camera-view__bg-icon">📷</span>
          <div className="fs-scan-frame-wrap">
            <div className="fs-scan-frame" />
          </div>
        </div>

        {phase === "upload" && (
          <div className="fs-scan-modal__body">
            <div className="fs-upload-drop" onClick={() => fileRef.current.click()}>
              <div className="fs-upload-drop__icon">📁</div>
              <div className="fs-upload-drop__text">Upload a plant photo to analyse</div>
              <div className="fs-upload-drop__hint">JPG, PNG up to 10MB</div>
            </div>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button className="fs-btn-upload" onClick={() => fileRef.current.click()}>
              📸 Take / Upload Photo
            </button>
            <button className="fs-btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        )}

        {phase === "processing" && (
          <div className="fs-processing">
            <div className="fs-spinner" />
            <div className="fs-processing__title">Analysing Plant...</div>
            <div className="fs-processing__desc">AI is examining the image for signs of disease and pests</div>
            <div className="fs-processing__step">{procStep}</div>
          </div>
        )}

        {phase === "result" && result && (
          <div className="fs-result">
            <div className="fs-result__header">
              <span className="fs-result__icon">{result.icon}</span>
              <div>
                <div className="fs-result__title">{result.title}</div>
                <div className="fs-result__conf">{result.conf}</div>
              </div>
            </div>
            <div className="fs-result__detail">{result.detail}</div>
            <div className="fs-result__actions-label">Recommended Actions</div>
            <div className="fs-result__sugs">
              {result.sugs.map((s, i) => (
                <div key={i} className="fs-result__sug">{s}</div>
              ))}
            </div>
            <button className="fs-btn-save" onClick={onClose}>✓ Save to Batch Record</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function FarmSenseDashboard() {
  const [filter, setFilter] = useState("All");
  const [qrBatch, setQrBatch] = useState(null);
  const [scanBatch, setScanBatch] = useState(null);

  const alertCount = BATCHES.filter((b) => b.status === "danger" || b.status === "warning").length;

  const filteredBatches = BATCHES.filter((b) => {
    if (filter === "Alerts") return b.status === "danger" || b.status === "warning";
    if (filter === "Healthy") return b.status === "healthy";
    return true;
  });

  return (
    <>
      <Navbar alertCount={alertCount} />

      <main className="fs-main">
        {/* Page Header */}
        <div className="fs-page-header">
          <div>
            <div className="fs-page-header__eyebrow">Sunday, 1 March 2026 · Kota Kinabalu</div>
            <h1 className="fs-page-header__title">
              Crop <em>Intelligence</em>
              <br />Dashboard
            </h1>
            <p className="fs-page-header__sub">
              Monitoring {BATCHES.length} active batches · Last sensor sync 4 min ago
            </p>
          </div>
          <button
            className="fs-btn-primary"
            onClick={() => alert("New Batch Registration — form to register crop type, GPS block, and sensor pairing.")}
          >
            <span className="fs-btn-primary__plus">+</span>
            Register New Batch
          </button>
        </div>

        {/* Stat Strip */}
        <StatStrip />

        {/* Section Row */}
        <div className="fs-section-row">
          <div className="fs-section-label">Registered Batches</div>
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

        {/* Batch Grid */}
        <div className="fs-batch-grid">
          {filteredBatches.map((batch, i) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              delay={0.05 + i * 0.05}
              onScan={(b) => setScanBatch(b)}
              onQR={(b) => setQrBatch(b)}
            />
          ))}
        </div>
      </main>

      {/* Modals */}
      {qrBatch && <QRModal batch={qrBatch} onClose={() => setQrBatch(null)} />}
      {scanBatch && <ScanModal batch={scanBatch} onClose={() => setScanBatch(null)} />}
    </>
  );
}
