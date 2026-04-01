import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./farmsense.css";

// ── Import separated pages ────────────────────────────────────────────────────
import AtmospherePage   from "./AtmospherePage";
import SoilPage         from "./SoilPage";
import DiseaseMapPage   from "./DiseaseMapPage";
import CropProfilesPage from "./CropProfilesPage";

// ═══════════════════════════════════════════════
// DATA (Dashboard only)
// ═══════════════════════════════════════════════

const BATCHES = [
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

const AI_RESULTS = {
  healthy: { icon: "✅", title: "No Disease or Pest Detected",    conf: "Confidence: 95%",                    detail: "No visible signs of disease or pest infestation. Leaf colour and texture are within normal parameters.",                                                         sugs: ["Maintain current irrigation and fertilisation", "Schedule next scan in 48–72 hours", "Document healthy baseline for trend comparison"] },
  aphid:   { icon: "🔎", title: "Aphid Infestation — Early Stage", conf: "Confidence: 82% · Aphis gossypii",   detail: "Small aphid colonies detected on undersides of younger leaves. Colony density is low — early intervention will prevent rapid growth.",                           sugs: ["Apply neem oil spray (2% solution) morning or evening", "Encourage natural predators (ladybugs, lacewings)", "Avoid high-nitrogen fertiliser", "Re-scan in 72 hours"] },
  blight:  { icon: "⚠️", title: "Early Blight Detected",           conf: "Confidence: 91% · Alternaria solani", detail: "Concentric ring lesions observed on lower leaves. Approximately 15% of foliage affected. Treat promptly.",                                                      sugs: ["Apply copper-based fungicide within 24 hours", "Remove and dispose of affected leaves — do not compost", "Raise soil moisture above 60%", "Re-scan in 48 hours"] },
};

const PROC_STEPS = [
  "Extracting visual features...",
  "Checking disease patterns...",
  "Cross-referencing pest database...",
  "Generating recommendations...",
  "Finalising analysis...",
];

// ═══════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════

function ScanModal({ batch, onClose }) {
  const [phase, setPhase] = useState("upload");
  const [step, setStep]   = useState(PROC_STEPS[0]);
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
          <p style={{ fontSize: "0.77rem", color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.6 }}>
            Print and attach to row marker. All camera scans will be automatically attributed to <strong style={{ color: "var(--charcoal)" }}>{batch.crop}</strong>.
          </p>
          <button className="fs-btn--primary fs-btn" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PAGE: DASHBOARD
// ═══════════════════════════════════════════════

function DashboardPage() {
  const [filter, setFilter]           = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [scanBatch, setScanBatch]     = useState(null);
  const [qrBatch, setQrBatch]         = useState(null);
  const alertCount = BATCHES.filter(b => b.status !== "healthy").length;

  const filtered = BATCHES.filter(b => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!b.crop.toLowerCase().includes(query) && !b.id.toLowerCase().includes(query)) return false;
    }
    if (filter === "Alerts")  return b.status !== "healthy";
    if (filter === "Healthy") return b.status === "healthy";
    return true;
  });

  const statusLabel = { healthy: "✓ Healthy", warning: "⚡ Warning", danger: "⚠ Critical" };
  const aiBoxCls    = { healthy: "", warning: "fs-ai-box--warn", danger: "fs-ai-box--alert" };
  const cardCls     = { healthy: "", warning: "fs-batch-card--warn", danger: "fs-batch-card--danger" };
  const barCls      = { healthy: "fs-batch-card__bar--healthy", warning: "fs-batch-card__bar--warning", danger: "fs-batch-card__bar--danger" };
  const pillCls     = { healthy: "fs-pill--healthy", warning: "fs-pill--warning", danger: "fs-pill--danger" };

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Sunday, 1 March 2026 · Kota Kinabalu</div>
          <h1 className="fs-page-title">Crop <em>Intelligence</em> Dashboard</h1>
          <p className="fs-page-sub">Monitoring {BATCHES.length} active batches · Last sensor sync 4 min ago</p>
        </div>
      </div>

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Active Batches</div><div className="fs-stat-card__val">6</div><div className="fs-stat-card__meta">Vegetables &amp; Fruits</div><span className="fs-stat-tag fs-stat-tag--good">All updated</span></div>
        <div className="fs-stat-card fs-stat-card--red"><div className="fs-stat-card__label">Alerts</div><div className="fs-stat-card__val fs-stat-card__val--danger">{alertCount}</div><div className="fs-stat-card__meta">Requires attention</div><span className="fs-stat-tag fs-stat-tag--danger">Critical</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Avg. Soil Moisture</div><div className="fs-stat-card__val fs-stat-card__val--warn">61%</div><div className="fs-stat-card__meta">Optimal 65–75%</div><span className="fs-stat-tag fs-stat-tag--warn">Low</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Healthy Batches</div><div className="fs-stat-card__val">4</div><div className="fs-stat-card__meta">No issues detected</div><span className="fs-stat-tag fs-stat-tag--good">On track</span></div>
      </div>

      <div className="fs-section-row">
        <div className="fs-section-label">Registered Batches</div>
        <button className="fs-btn fs-btn--gold fs-btn--sm">+ Register New Batch</button>
      </div>

      <div className="fs-section-row2">
        <div className="fs-search-group">
          <input
            type="text"
            className="fs-search-input"
            placeholder="Search crop name or batch ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="fs-search-reset" onClick={() => setSearchQuery("")} title="Clear search">Reset</button>
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
                {b.sensors.map(s => (
                  <div key={s.name} className="fs-sensor-mini">
                    <span className="fs-sensor-mini__icon">{s.icon}</span>
                    <span className="fs-sensor-mini__name">{s.name}</span>
                    <span className={`fs-sensor-mini__val fs-sensor-mini__val--${s.state}`}>{s.val}</span>
                  </div>
                ))}
              </div>
              <div className={`fs-ai-box ${aiBoxCls[b.status]} fs-ai-cam`}>
                <div>
                  <div className="fs-ai-box__tag"><span className="fs-ai-box__emoji">🔍</span> AI Camera Vision</div>
                  <div className="fs-ai-box__result">{b.aiDetection}</div>
                  <div className="fs-ai-box__conf">{b.aiConf}</div>
                </div>
              </div>
              <div className="fs-suggestion"><div className="fs-suggestion__label">AI Recommendation</div>{b.suggestion}</div>
              <div className="fs-batch-actions">
                <button className="fs-btn-scan" onClick={() => setScanBatch(b)}><span className="fs-btn-scan__dot">◉</span>Scan with Camera</button>
                <button className="fs-btn-qr" onClick={() => setQrBatch(b)}>▦</button>
              </div>
              <div className="fs-batch-card__last-scan">Last scan: {b.lastScan}</div>
            </div>
          </div>
        ))}
      </div>

      {scanBatch && <ScanModal batch={scanBatch} onClose={() => setScanBatch(null)} />}
      {qrBatch   && <QRModal  batch={qrBatch}   onClose={() => setQrBatch(null)}   />}
    </>
  );
}

// ═══════════════════════════════════════════════
// SIDEBAR + APP SHELL
// ═══════════════════════════════════════════════

const NAV_ITEMS = [
  { page: "Dashboard",    icon: "🏠",  label: "Dashboard",    section: "Main"          },
  { page: "Atmosphere",   icon: "🌤️",  label: "Atmosphere",   section: "Monitoring"    },
  { page: "Soil Health",  icon: "🪱",  label: "Soil Health",  section: "Monitoring"    },
  { page: "Disease Map",  icon: "🗺️",  label: "Disease Map",  section: "Monitoring"    },
  { page: "Crop Profiles",icon: "🌱",  label: "Crop Profiles",section: "Configuration" },
];

export default function FarmSenseApp() {
  const [activePage, setActivePage] = useState("Dashboard");
  const navigate    = useNavigate();
  const alertCount  = BATCHES.filter(b => b.status !== "healthy").length;

  const grouped = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const handleLogout = () => {
    localStorage.removeItem("aifarm-auth");
    navigate("/login");
  };

  const PAGE_COMPONENTS = {
    "Dashboard":    <DashboardPage />,
    "Atmosphere":   <AtmospherePage />,
    "Soil Health":  <SoilPage />,
    "Disease Map":  <DiseaseMapPage />,
    "Crop Profiles":<CropProfilesPage />,
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
                  {item.page === "Dashboard"   && alertCount > 0 && <span className="fs-nav-item__badge">{alertCount}</span>}
                  {item.page === "Disease Map" && <span className="fs-nav-item__badge">2</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div>
          <button className="fs-nav-item fs-sidebar__logout" onClick={handleLogout} title="Logout">
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

// import { useState, useRef } from "react";
// import "./farmsense.css";

// // ─── DATA ────────────────────────────────────────────────────────────────────

// const BATCHES = [
//   {
//     id: "BATCH-001", crop: "🍅 Tomatoes", location: "Block A · Row 1–12",
//     planted: "12 Jan 2026", status: "danger",
//     sensors: [
//       { icon: "🌡️", name: "Temp",     val: "34°C", state: "warn" },
//       { icon: "💧", name: "Moisture", val: "42%",  state: "bad"  },
//       { icon: "🌤️", name: "Humidity", val: "68%",  state: "ok"   },
//       { icon: "⚗️", name: "pH",       val: "5.8",  state: "warn" },
//     ],
//     aiDetection: "Early Blight (Alternaria solani)",
//     aiConf: "Confidence: 91% · Last scan: 2h ago",
//     suggestion: "Apply copper-based fungicide within 24 hours. Remove affected lower leaves. Increase irrigation to raise soil moisture above 60% and improve air circulation.",
//     lastScan: "Today 08:42 AM",
//   },
//   {
//     id: "BATCH-002", crop: "🥬 Lettuce", location: "Block B · Row 1–8",
//     planted: "20 Jan 2026", status: "warning",
//     sensors: [
//       { icon: "🌡️", name: "Temp",     val: "26°C", state: "ok"   },
//       { icon: "💧", name: "Moisture", val: "58%",  state: "warn" },
//       { icon: "🌤️", name: "Humidity", val: "72%",  state: "ok"   },
//       { icon: "⚗️", name: "pH",       val: "6.4",  state: "ok"   },
//     ],
//     aiDetection: "Aphid Presence — Low Density",
//     aiConf: "Confidence: 78% · Last scan: 5h ago",
//     suggestion: "Monitor daily. Consider neem oil spray as preventive measure. Check undersides of leaves. No immediate chemical treatment required at this density.",
//     lastScan: "Today 05:15 AM",
//   },
//   {
//     id: "BATCH-003", crop: "🫑 Bell Peppers", location: "Block C · Row 3–10",
//     planted: "5 Jan 2026", status: "healthy",
//     sensors: [
//       { icon: "🌡️", name: "Temp",     val: "28°C", state: "ok" },
//       { icon: "💧", name: "Moisture", val: "70%",  state: "ok" },
//       { icon: "🌤️", name: "Humidity", val: "65%",  state: "ok" },
//       { icon: "⚗️", name: "pH",       val: "6.8",  state: "ok" },
//     ],
//     aiDetection: "No Disease or Pest Detected",
//     aiConf: "Confidence: 97% · Last scan: 1h ago",
//     suggestion: "Crop is in excellent condition. Maintain current irrigation. Consider balanced NPK fertiliser next week as plants approach fruiting stage.",
//     lastScan: "Today 09:05 AM",
//   },
//   {
//     id: "BATCH-004", crop: "🥒 Cucumber", location: "Block D · Row 1–6",
//     planted: "18 Jan 2026", status: "healthy",
//     sensors: [
//       { icon: "🌡️", name: "Temp",     val: "27°C", state: "ok" },
//       { icon: "💧", name: "Moisture", val: "74%",  state: "ok" },
//       { icon: "🌤️", name: "Humidity", val: "70%",  state: "ok" },
//       { icon: "⚗️", name: "pH",       val: "6.5",  state: "ok" },
//     ],
//     aiDetection: "No Disease or Pest Detected",
//     aiConf: "Confidence: 94% · Last scan: 3h ago",
//     suggestion: "Growth rate is on target. Ensure trellis support is secure as vines develop. Soil moisture is optimal — continue current drip irrigation timing.",
//     lastScan: "Today 07:20 AM",
//   },
//   {
//     id: "BATCH-005", crop: "🍓 Strawberries", location: "Block E · Row 1–4",
//     planted: "2 Feb 2026", status: "healthy",
//     sensors: [
//       { icon: "🌡️", name: "Temp",     val: "24°C", state: "ok" },
//       { icon: "💧", name: "Moisture", val: "68%",  state: "ok" },
//       { icon: "🌤️", name: "Humidity", val: "62%",  state: "ok" },
//       { icon: "⚗️", name: "pH",       val: "5.9",  state: "ok" },
//     ],
//     aiDetection: "No Disease or Pest Detected",
//     aiConf: "Confidence: 95% · Last scan: 2h ago",
//     suggestion: "Plants are in flowering stage. Avoid wetting foliage to reduce botrytis risk. Pollinator activity observed — conditions are ideal for fruit set.",
//     lastScan: "Today 08:00 AM",
//   },
//   {
//     id: "BATCH-006", crop: "🫛 Long Beans", location: "Block F · Row 1–10",
//     planted: "25 Jan 2026", status: "healthy",
//     sensors: [
//       { icon: "🌡️", name: "Temp",     val: "29°C", state: "ok" },
//       { icon: "💧", name: "Moisture", val: "66%",  state: "ok" },
//       { icon: "🌤️", name: "Humidity", val: "67%",  state: "ok" },
//       { icon: "⚗️", name: "pH",       val: "6.2",  state: "ok" },
//     ],
//     aiDetection: "No Disease or Pest Detected",
//     aiConf: "Confidence: 92% · Last scan: 4h ago",
//     suggestion: "Healthy growth observed. Potassium supplement recommended in 2 weeks to support pod development. Next scan at sunrise tomorrow.",
//     lastScan: "Today 06:45 AM",
//   },
// ];

// const AI_RESULTS = {
//   healthy: {
//     icon: "✅", title: "No Disease or Pest Detected",
//     conf: "Confidence: 95% · Plant appears healthy",
//     detail: "No visible signs of disease, pest infestation, or nutritional deficiency detected. Leaf colour, texture, and structure are within normal parameters for this crop growth stage.",
//     sugs: [
//       "Maintain current irrigation and fertilisation schedule",
//       "Schedule next scan in 48–72 hours for routine monitoring",
//       "Document current healthy baseline for trend comparison",
//     ],
//   },
//   aphid: {
//     icon: "🔎", title: "Aphid Infestation — Early Stage",
//     conf: "Confidence: 82% · Aphis gossypii",
//     detail: "Small colonies of aphids detected on undersides of younger leaves. Colony density is currently low. Early intervention will prevent rapid population growth and virus transmission risk.",
//     sugs: [
//       "Apply neem oil spray (2% solution) in the early morning or evening",
//       "Introduce or encourage natural predators such as ladybugs",
//       "Avoid high-nitrogen fertiliser which promotes the soft leaf growth aphids prefer",
//       "Re-scan in 72 hours to assess population response",
//     ],
//   },
//   blight: {
//     icon: "⚠️", title: "Early Blight Detected",
//     conf: "Confidence: 91% · Alternaria solani",
//     detail: "Characteristic concentric ring lesions observed on lower leaves. Affected area covers approximately 15% of sampled foliage. Condition is in early stage — treatment will be effective if applied promptly.",
//     sugs: [
//       "Apply copper-based fungicide (e.g. Bordeaux mixture) within 24 hours",
//       "Remove and dispose of visibly affected leaves — do not compost",
//       "Increase irrigation to raise soil moisture above 60%",
//       "Re-scan in 48 hours to monitor treatment effectiveness",
//     ],
//   },
// };

// const PROC_STEPS = [
//   "Extracting visual features...",
//   "Checking disease patterns...",
//   "Cross-referencing pest database...",
//   "Generating recommendations...",
//   "Finalising analysis...",
// ];

// // ─── COMPONENTS ──────────────────────────────────────────────────────────────

// function Navbar({ alertCount }) {
//   const [active, setActive] = useState("Dashboard");
//   const links = ["Dashboard", "Batches", "Sensors", "Reports", "Settings"];
//   return (
//     <nav className="fs-nav">
//       <div className="fs-nav__brand">
//         <div className="fs-nav__logo">🌿</div>
//         <div className="fs-nav__title">Ai<span>Farm</span></div>
//       </div>
//       <div className="fs-nav__links">
//         {links.map((l) => (
//           <button
//             key={l}
//             className={`fs-nav__link ${active === l ? "fs-nav__link--active" : ""}`}
//             onClick={() => setActive(l)}
//           >
//             {l}
//           </button>
//         ))}
//       </div>
//       <div className="fs-nav__right">
//         {alertCount > 0 && (
//           <span className="fs-nav__alert-badge">{alertCount} Alert{alertCount > 1 ? "s" : ""}</span>
//         )}
//         <span className="fs-nav__farm-id">FARM-KK-001</span>
//         <div className="fs-nav__avatar">JD</div>
//       </div>
//     </nav>
//   );
// }

// function StatStrip() {
//   return (
//     <div className="fs-stat-strip">
//       <div className="fs-stat-card fs-stat-card--gold">
//         <div className="fs-stat-card__label">Active Batches</div>
//         <div className="fs-stat-card__val">6</div>
//         <div className="fs-stat-card__meta">Vegetables &amp; Fruits</div>
//         <span className="fs-stat-tag fs-stat-tag--good">All registered</span>
//       </div>
//       <div className="fs-stat-card fs-stat-card--red">
//         <div className="fs-stat-card__label">Alerts</div>
//         <div className="fs-stat-card__val fs-stat-card__val--danger">2</div>
//         <div className="fs-stat-card__meta">Requires attention</div>
//         <span className="fs-stat-tag fs-stat-tag--danger">Critical</span>
//       </div>
//       <div className="fs-stat-card fs-stat-card--amber">
//         <div className="fs-stat-card__label">Avg. Soil Moisture</div>
//         <div className="fs-stat-card__val fs-stat-card__val--warn">61%</div>
//         <div className="fs-stat-card__meta">Optimal 65–75%</div>
//         <span className="fs-stat-tag fs-stat-tag--warn">Low</span>
//       </div>
//       <div className="fs-stat-card fs-stat-card--green">
//         <div className="fs-stat-card__label">Healthy Batches</div>
//         <div className="fs-stat-card__val">4</div>
//         <div className="fs-stat-card__meta">No issues detected</div>
//         <span className="fs-stat-tag fs-stat-tag--good">On track</span>
//       </div>
//     </div>
//   );
// }

// function SensorMini({ icon, name, val, state }) {
//   return (
//     <div className="fs-sensor-mini">
//       <span className="fs-sensor-mini__icon">{icon}</span>
//       <span className="fs-sensor-mini__name">{name}</span>
//       <span className={`fs-sensor-mini__val fs-sensor-mini__val--${state}`}>{val}</span>
//     </div>
//   );
// }

// function BatchCard({ batch, onScan, onQR, delay }) {
//   const statusLabel = { healthy: "✓ Healthy", warning: "⚡ Warning", danger: "⚠ Critical" };
//   const aiBoxClass = { healthy: "", warning: "fs-ai-box--warn", danger: "fs-ai-box--alert" };

//   return (
//     <div
//       className={`fs-batch-card ${batch.status === "danger" ? "fs-batch-card--danger" : batch.status === "warning" ? "fs-batch-card--warn" : ""}`}
//       style={{ animationDelay: `${delay}s` }}
//     >
//       <div className={`fs-batch-card__bar fs-batch-card__bar--${batch.status === "danger" ? "danger" : batch.status === "warning" ? "warning" : "healthy"}`} />
//       <div className="fs-batch-card__header">
//         <div>
//           <div className="fs-batch-card__crop">{batch.crop}</div>
//           <div className="fs-batch-card__loc">📍 {batch.location}</div>
//           <div className="fs-batch-card__id">{batch.id} · Planted {batch.planted}</div>
//         </div>
//         <span className={`fs-status-pill fs-status-pill--${batch.status}`}>
//           {statusLabel[batch.status]}
//         </span>
//       </div>
//       <div className="fs-batch-card__body">
//         <div className="fs-sensor-row">
//           {batch.sensors.map((s) => (
//             <SensorMini key={s.name} {...s} />
//           ))}
//         </div>
//         <div className={`fs-ai-box ${aiBoxClass[batch.status]}`}>
//           <span className="fs-ai-box__emoji">🔍</span>
//           <div>
//             <div className="fs-ai-box__tag">AI Camera Vision</div>
//             <div className="fs-ai-box__result">{batch.aiDetection}</div>
//             <div className="fs-ai-box__conf">{batch.aiConf}</div>
//           </div>
//         </div>
//         <div className="fs-suggestion">
//           <div className="fs-suggestion__label">AI Recommendation</div>
//           {batch.suggestion}
//         </div>
//         <div className="fs-batch-actions">
//           <button className="fs-btn-scan" onClick={() => onScan(batch)}>
//             <span className="fs-btn-scan__dot">◉</span> Scan with Camera
//           </button>
//           <button className="fs-btn-qr" onClick={() => onQR(batch)} title="Show QR Code">▦</button>
//         </div>
//         <div className="fs-batch-card__last-scan">Last scan: {batch.lastScan}</div>
//       </div>
//     </div>
//   );
// }

// function QRModal({ batch, onClose }) {
//   if (!batch) return null;
//   return (
//     <div className="fs-modal-overlay" onClick={onClose}>
//       <div className="fs-qr-modal" onClick={(e) => e.stopPropagation()}>
//         <div className="fs-qr-modal__eyebrow">Batch QR Code</div>
//         <div className="fs-qr-modal__title">{batch.crop}</div>
//         <div className="fs-qr-modal__sub">Scan to link your phone camera to this batch</div>
//         <div className="fs-qr-modal__code-box">▦</div>
//         <div className="fs-qr-modal__batch-id">{batch.id}</div>
//         <p className="fs-qr-modal__info">
//           Print and attach to row marker. All camera scans will be automatically attributed to{" "}
//           <strong>{batch.crop}</strong> — no manual entry needed.
//         </p>
//         <button className="fs-btn-modal-close" onClick={onClose}>Done</button>
//       </div>
//     </div>
//   );
// }

// function ScanModal({ batch, onClose }) {
//   const [phase, setPhase] = useState("upload"); // upload | processing | result
//   const [procStep, setProcStep] = useState(PROC_STEPS[0]);
//   const [result, setResult] = useState(null);
//   const fileRef = useRef();

//   if (!batch) return null;

//   const handleFileChange = () => {
//     setPhase("processing");
//     let i = 0;
//     const iv = setInterval(() => {
//       if (i < PROC_STEPS.length) {
//         setProcStep(PROC_STEPS[i++]);
//       } else {
//         clearInterval(iv);
//         const keys = Object.keys(AI_RESULTS);
//         setResult(AI_RESULTS[keys[Math.floor(Math.random() * keys.length)]]);
//         setPhase("result");
//       }
//     }, 850);
//   };

//   return (
//     <div className="fs-modal-overlay" onClick={onClose}>
//       <div className="fs-scan-modal" onClick={(e) => e.stopPropagation()}>
//         <div className="fs-scan-modal__top">
//           <div className="fs-scan-modal__eyebrow">AI Camera Vision</div>
//           <div className="fs-scan-modal__title">
//             Scanning: <span>{batch.crop}</span>
//           </div>
//           <div className="fs-scan-modal__sub">{batch.id} · Point camera at leaves or stems</div>
//         </div>
//         <div className="fs-camera-view">
//           <span className="fs-camera-view__bg-icon">📷</span>
//           <div className="fs-scan-frame-wrap">
//             <div className="fs-scan-frame" />
//           </div>
//         </div>

//         {phase === "upload" && (
//           <div className="fs-scan-modal__body">
//             <div className="fs-upload-drop" onClick={() => fileRef.current.click()}>
//               <div className="fs-upload-drop__icon">📁</div>
//               <div className="fs-upload-drop__text">Upload a plant photo to analyse</div>
//               <div className="fs-upload-drop__hint">JPG, PNG up to 10MB</div>
//             </div>
//             <input
//               type="file"
//               ref={fileRef}
//               accept="image/*"
//               style={{ display: "none" }}
//               onChange={handleFileChange}
//             />
//             <button className="fs-btn-upload" onClick={() => fileRef.current.click()}>
//               📸 Take / Upload Photo
//             </button>
//             <button className="fs-btn-cancel" onClick={onClose}>Cancel</button>
//           </div>
//         )}

//         {phase === "processing" && (
//           <div className="fs-processing">
//             <div className="fs-spinner" />
//             <div className="fs-processing__title">Analysing Plant...</div>
//             <div className="fs-processing__desc">AI is examining the image for signs of disease and pests</div>
//             <div className="fs-processing__step">{procStep}</div>
//           </div>
//         )}

//         {phase === "result" && result && (
//           <div className="fs-result">
//             <div className="fs-result__header">
//               <span className="fs-result__icon">{result.icon}</span>
//               <div>
//                 <div className="fs-result__title">{result.title}</div>
//                 <div className="fs-result__conf">{result.conf}</div>
//               </div>
//             </div>
//             <div className="fs-result__detail">{result.detail}</div>
//             <div className="fs-result__actions-label">Recommended Actions</div>
//             <div className="fs-result__sugs">
//               {result.sugs.map((s, i) => (
//                 <div key={i} className="fs-result__sug">{s}</div>
//               ))}
//             </div>
//             <button className="fs-btn-save" onClick={onClose}>✓ Save to Batch Record</button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── MAIN APP ─────────────────────────────────────────────────────────────────

// export default function FarmSenseDashboard() {
//   const [filter, setFilter] = useState("All");
//   const [qrBatch, setQrBatch]   = useState(null);
//   const [scanBatch, setScanBatch] = useState(null);

//   const alertCount = BATCHES.filter((b) => b.status === "danger" || b.status === "warning").length;

//   const filteredBatches = BATCHES.filter((b) => {
//     if (filter === "Alerts")  return b.status === "danger" || b.status === "warning";
//     if (filter === "Healthy") return b.status === "healthy";
//     return true;
//   });

//   return (
//     <>
//       <Navbar alertCount={alertCount} />

//       <main className="fs-main">
//         {/* Page Header */}
//         <div className="fs-page-header">
//           <div>
//             <div className="fs-page-header__eyebrow">Sunday, 1 March 2026 · Kota Kinabalu</div>
//             <h1 className="fs-page-header__title">
//               Crop <em>Intelligence</em>
//               <br />Dashboard
//             </h1>
//             <p className="fs-page-header__sub">
//               Monitoring {BATCHES.length} active batches · Last sensor sync 4 min ago
//             </p>
//           </div>
//           <button
//             className="fs-btn-primary"
//             onClick={() => alert("New Batch Registration — form to register crop type, GPS block, and sensor pairing.")}
//           >
//             <span className="fs-btn-primary__plus">+</span>
//             Register New Batch
//           </button>
//         </div>

//         {/* Stat Strip */}
//         <StatStrip />

//         {/* Section Row */}
//         <div className="fs-section-row">
//           <div className="fs-section-label">Registered Batches</div>
//           <div className="fs-filter-group">
//             {["All", "Alerts", "Healthy"].map((f) => (
//               <button
//                 key={f}
//                 className={`fs-filter-pill ${filter === f ? "fs-filter-pill--active" : ""}`}
//                 onClick={() => setFilter(f)}
//               >
//                 {f}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Batch Grid */}
//         <div className="fs-batch-grid">
//           {filteredBatches.map((batch, i) => (
//             <BatchCard
//               key={batch.id}
//               batch={batch}
//               delay={0.05 + i * 0.05}
//               onScan={(b) => setScanBatch(b)}
//               onQR={(b) => setQrBatch(b)}
//             />
//           ))}
//         </div>
//       </main>

//       {/* Modals */}
//       {qrBatch   && <QRModal   batch={qrBatch}   onClose={() => setQrBatch(null)} />}
//       {scanBatch && <ScanModal batch={scanBatch} onClose={() => setScanBatch(null)} />}
//     </>
//   );
// }
