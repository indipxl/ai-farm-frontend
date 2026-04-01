import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // Reset errors before checking
    const newErrors = { email: '', password: '', general: '' };
    let hasError = false;

    // ── 1. Inline Checks ──────────────────────────────────────────
    if (!email.trim()) {
      newErrors.email = "Email is required";
      hasError = true;
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      newErrors.general = "Incorrect email or password. Please try again.";
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  // Demo fallback for styling
  const handleDemoLogin = () => {
    setEmail('admin@aifarm.com');
    setPassword('admin123');
  };

  return (
    <div style={styles.root}>
      {/* ── Left panel — dark sidebar matching dashboard ── */}
      <div style={styles.left}>
        {/* Decorative crop grid background */}
        <div style={styles.gridOverlay} />

        <div style={styles.leftContent}>
          {/* Logo - click to return to landing page */}
          <div
            style={{ ...styles.logo, cursor: "pointer" }}
            onClick={() => navigate("/")}
            title="Back to Home"
          >
            <span style={styles.logoIcon}>🌱</span>
            <span style={styles.logoText}>Ai Farm</span>
          </div>

          {/* Hero copy */}
          <div style={styles.heroBlock}>
            <p style={styles.heroEyebrow}>CROP INTELLIGENCE PLATFORM</p>
            <h1 style={styles.heroTitle}>
              Smart Farming<br />
              <span style={styles.heroAccent}>Starts Here</span>
            </h1>
            <p style={styles.heroSub}>
              Monitor your crops, soil health, and get personalized treatment recommendations<br></br>— all in one place.
            </p>
          </div>

          {/* Stats strip */}
          <div style={styles.statsRow}>
            {[
              { value: "6", label: "Active Batches" },
              { value: "98%", label: "Detection Rate" },
              { value: "24/7", label: "IoT Monitoring" },
            ].map((s) => (
              <div key={s.label} style={styles.statItem}>
                <span style={styles.statValue}>{s.value}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Farm badge */}
          <div style={styles.farmBadge}>
            <span style={styles.liveDot} />
            <span style={styles.farmBadgeText}>IoT sync · Live · Kota Kinabalu · KK-001</span>
          </div>
        </div>
      </div>

      {/* ── Right panel — cream login form ── */}
      <div style={styles.right}>
        <div style={styles.formCard}>

          {/* Breadcrumb */}
          <p style={styles.breadcrumb}>AI Farm &rsaquo; <strong>Sign In</strong></p>

          <h2 style={styles.formTitle}>Welcome back</h2>
          <p style={styles.formSub}>Sign in to your farm dashboard</p>

          <form onSubmit={handleLogin} style={styles.form}>

            {/* Email */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Email address</label>
              </div>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>✉️</span>
                <input
                  type="email"
                  placeholder="admin@aifarm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <p style={{ color: "#c0392b", fontSize: '12px', textAlign: 'left' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                {/* <a href="#" style={styles.forgotLink}>Forgot password?</a> */}
              </div>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <p style={{ color: "#c0392b", fontSize: '12px', textAlign: 'left' }}>{errors.password}</p>}
            </div>
            {/* General Firebase Error (like wrong password) */}
            {errors.general && (
              <p style={{ ...styles.inlineError, textAlign: 'center', marginBottom: '10px' }}>
                {errors.general}
              </p>
            )}            <button type="submit" disabled={loading} style={{ color: "white" }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            {/* <button type="button" onClick={handleDemoLogin} style={{ color: "white" }}>
              Demo Login
            </button> */}

          </form>

          {/* Divider */}
          {/* <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with</span>
            <span style={styles.dividerLine} />
          </div> */}

          {/* SSO */}
          {/* <div style={styles.ssoRow}>
            {[
              { icon: "🏢", label: "Microsoft" },
              { icon: "🔑", label: "SSO" },
            ].map((p) => (
              <button key={p.label} style={styles.ssoBtn}>
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div> */}

          {/* Footer */}
          {/* <p style={styles.footerNote}>
            Don't have an account?{" "}
            <a href="#" style={styles.footerLink}>Request access</a>
          </p> */}

        </div>

        {/* Bottom credit */}
        <p style={styles.demoHint}>Demo credentials: admin@aifarm.com / admin123</p>
        <p style={styles.credit}>© 2026 Ai Farm · All rights reserved</p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const C = {
  sidebarBg: "#1c1f16",
  contentBg: "#f0ece4",
  cardBg: "#faf7f2",
  gold: "#c8973a",
  green: "#4a7c59",
  textDark: "#1c1f16",
  textMuted: "#7a7060",
  border: "#ddd8ce",
  inputBg: "#f0ece4",
};

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
    fontFamily: "'Georgia', serif",
    background: C.contentBg,
    overflow: "hidden",
  },

  // ── Left ──
  left: {
    width: "42%",
    background: C.sidebarBg,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    flexShrink: 0,
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "2.5rem",
    gap: "auto",
  },

  // Logo
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "auto",
  },
  logoIcon: { fontSize: "1.8rem" },
  logoText: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.02em",
  },

  // Hero
  heroBlock: { marginTop: "3rem", marginBottom: "2.5rem", textAlign: "center" },
  heroEyebrow: {
    fontSize: "0.68rem",
    letterSpacing: "0.18em",
    color: C.gold,
    fontFamily: "'Segoe UI', sans-serif",
    marginBottom: "1rem",
    margin: "0 0 1rem",
  },
  heroTitle: {
    fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1.2,
    margin: "0 0 1rem",
  },
  heroAccent: { color: C.gold },
  heroSub: {
    fontSize: "0.9rem",
    color: "#9a9080",
    lineHeight: 1.7,
    margin: "0 auto",
    maxWidth: 320,
    fontFamily: "'Segoe UI', sans-serif",
    textAlign: "center",
  },

  // Stats
  statsRow: {
    display: "flex",
    gap: "2rem",
    padding: "1.5rem 0",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "1.5rem",
    justifyContent: "center",
    width: "100%",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: C.gold,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.7rem",
    color: "#7a7060",
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "0.05em",
  },

  // Farm badge
  farmBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "auto",
    paddingTop: "2rem",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
    flexShrink: 0,
  },
  farmBadgeText: {
    fontSize: "0.72rem",
    color: "#6a6050",
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "0.04em",
  },

  // ── Right ──
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    background: C.contentBg,
  },
  formCard: {
    background: C.cardBg,
    borderRadius: "20px",
    border: `1px solid ${C.border}`,
    padding: "2.5rem",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 8px 40px rgba(28,31,22,0.08)",
  },

  breadcrumb: {
    fontSize: "0.72rem",
    color: C.textMuted,
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "0.04em",
    marginBottom: "1.5rem",
    margin: "0 0 1.5rem",
  },
  formTitle: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: C.textDark,
    margin: "0 0 0.3rem",
    textAlign: "center",
  },
  formSub: {
    fontSize: "0.88rem",
    color: C.textMuted,
    fontFamily: "'Segoe UI', sans-serif",
    margin: "0 0 2rem",
    textAlign: "center",
  },

  // Form fields
  form: { display: "flex", flexDirection: "column", gap: "1.2rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: C.textDark,
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "0.03em",
  },
  forgotLink: {
    fontSize: "0.75rem",
    color: C.green,
    textDecoration: "none",
    fontFamily: "'Segoe UI', sans-serif",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    background: C.inputBg,
    border: `1.5px solid ${C.border}`,
    borderRadius: "10px",
    padding: "0 0.75rem",
    gap: "0.5rem",
    transition: "border-color 0.2s",
  },
  inputIcon: { fontSize: "1rem", flexShrink: 0 },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0.75rem 0",
    fontSize: "0.9rem",
    color: C.textDark,
    fontFamily: "'Segoe UI', sans-serif",
    outline: "none",
  },
  eyeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0",
    flexShrink: 0,
  },

  // Remember me
  rememberRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "-0.2rem",
  },
  rememberLabel: {
    fontSize: "0.82rem",
    color: C.textMuted,
    fontFamily: "'Segoe UI', sans-serif",
    cursor: "pointer",
  },

  // Submit button — dark like sidebar
  submitBtn: {
    background: C.sidebarBg,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "0.9rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "0.03em",
    transition: "opacity 0.2s",
    marginTop: "0.4rem",
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  // Divider
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    margin: "1.5rem 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: C.border,
  },
  dividerText: {
    fontSize: "0.75rem",
    color: C.textMuted,
    fontFamily: "'Segoe UI', sans-serif",
    whiteSpace: "nowrap",
  },

  // SSO
  ssoRow: { display: "flex", gap: "0.75rem" },
  ssoBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    background: C.inputBg,
    border: `1.5px solid ${C.border}`,
    borderRadius: "10px",
    padding: "0.65rem",
    fontSize: "0.85rem",
    color: C.textDark,
    fontFamily: "'Segoe UI', sans-serif",
    cursor: "pointer",
    fontWeight: 600,
  },

  // Footer
  footerNote: {
    textAlign: "center",
    fontSize: "0.8rem",
    color: C.textMuted,
    fontFamily: "'Segoe UI', sans-serif",
    marginTop: "1.25rem",
    margin: "1.25rem 0 0",
  },
  demoHint: {
    fontSize: "0.75rem",
    color: C.textMuted,
    textAlign: "center",
    marginTop: "1.5rem",
    fontFamily: "'Segoe UI', sans-serif",
  },
  footerLink: {
    color: C.green,
    fontWeight: 600,
    textDecoration: "none",
  },

  credit: {
    marginTop: "1.5rem",
    fontSize: "0.7rem",
    color: "#b0a898",
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: "0.04em",
  },

};