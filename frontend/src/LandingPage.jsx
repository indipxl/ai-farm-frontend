import { useState, useEffect } from "react";

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  sidebarBg: "#1c1f16",
  contentBg: "#f0ece4",
  cardBg: "#faf7f2",
  gold: "#c8973a",
  goldLight: "#f5e6c8",
  green: "#4a7c59",
  greenLight: "#d6e8dc",
  textDark: "#1c1f16",
  textMuted: "#7a7060",
  border: "#ddd8ce",
  red: "#c0392b",
};

// ── Data ──────────────────────────────────────────────────────────────────────

// ✅ FIX 1: Removed broken document.addEventListener — not valid in React.
//    NAV_LINKS renders directly via .map() in JSX.
const NAV_LINKS = ["Features", "How It Works", "Pricing", "About"];

const STATS = [
  { value: "98%", label: "Detection Accuracy" },
  { value: "500+", label: "Active Farms" },
  { value: "24/7", label: "IoT Monitoring" },
  { value: "6 sec", label: "Avg Response Time" },
];

const FEATURES = [
  { icon: "🔍", title: "AI Crop Detection", desc: "Real-time ripeness detection with 98% accuracy using computer vision trained on Southeast Asian crops.", tag: "Computer Vision", tagColor: C.gold, tagBg: C.goldLight },
  { icon: "🌡️", title: "Atmosphere Monitoring", desc: "Live temperature, humidity, and weather tracking per farm zone — synced from IoT sensors every 6 seconds.", tag: "IoT Sensors", tagColor: C.green, tagBg: C.greenLight },
  { icon: "🧪", title: "Soil Intelligence", desc: "Automated soil pH, moisture, nutrient (NPK), and electrical conductivity analysis with AI recommendations.", tag: "Soil AI", tagColor: C.gold, tagBg: C.goldLight },
  { icon: "🗺️", title: "Disease Mapping", desc: "Spatial disease spread detection across farm blocks — get early alerts before outbreaks escalate.", tag: "Disease AI", tagColor: C.red, tagBg: "#fde8e8" },
  { icon: "📊", title: "Harvest Analytics", desc: "Weekly and monthly yield reports, zone comparisons, and harvest scheduling recommendations.", tag: "Analytics", tagColor: C.green, tagBg: C.greenLight },
  { icon: "📋", title: "Batch Management", desc: "Register and track crop batches from planting to harvest with full audit trails and IoT sync.", tag: "Management", tagColor: C.textMuted, tagBg: "#ece8e0" },
];

const STEPS = [
  { num: "01", title: "Register Your Farm", desc: "Set up your farm profile, define zones, and register your crop batches in minutes." },
  { num: "02", title: "Connect IoT Sensors", desc: "Pair your soil and atmosphere sensors. Live data streams instantly to your dashboard." },
  { num: "03", title: "AI Analyses Your Farm", desc: "Our models continuously monitor crop health, ripeness, soil quality, and pest risks." },
  { num: "04", title: "Act on Intelligence", desc: "Receive alerts, harvest recommendations, and actionable insights — before problems grow." },
];

const TESTIMONIALS = [
  { name: "Ahmad Razif", role: "Palm Oil Farmer · Sabah", avatar: "🧑🏽‍🌾", quote: "Ai Farm cut our overripe losses by 40% in the first season. The AI detection is frighteningly accurate." },
  { name: "Siti Rahayu", role: "Farm Manager · Keningau", avatar: "👩🏽‍🌾", quote: "The soil health recommendations alone paid for the subscription. We now know exactly when and what to fertilise." },
  { name: "James Lim", role: "Agri Director · Sandakan", avatar: "👨🏻‍💼", quote: "Managing 6 farm zones from one dashboard is a game-changer. Real-time alerts mean we never miss a harvest window." },
];

const PLANS = [
  { name: "Starter", price: "RM 299", period: "/ month", desc: "For small farms just getting started", highlight: false, cta: "Get Started", features: ["Up to 2 farm zones", "AI crop detection", "Basic soil monitoring", "Weather alerts", "Email support"] },
  { name: "Professional", price: "RM 699", period: "/ month", desc: "For serious farm operations", highlight: true, cta: "Start Free Trial", features: ["Up to 10 farm zones", "Full AI detection suite", "Advanced soil AI", "Disease mapping", "Batch management", "Priority support"] },
  { name: "Enterprise", price: "Custom", period: "", desc: "For large-scale agri businesses", highlight: false, cta: "Contact Sales", features: ["Unlimited zones", "Custom AI models", "API access", "Dedicated IoT setup", "On-site training", "24/7 SLA support"] },
];

// ── Navbar / Topbar ───────────────────────────────────────────────────────────

function Navbar({ scrolled }) {
  // ✅ FIX 3: `open` is now actually used — controls the mobile dropdown
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      ...styles.navbar,
      background: scrolled ? "rgba(28,31,22,0.97)" : "rgba(28,31,22,0.55)",
      backdropFilter: scrolled ? "blur(14px)" : "blur(4px)",
      boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.35)" : "none",
    }}>

      {/* ── Announcement strip ── */}
      {/* <div style={styles.announcementBar}>
        <span style={styles.liveDot} />
        <span style={styles.announcementText}>
          🌾 New: Disease Mapping AI now available for all Professional plans &nbsp;·&nbsp;
          <a href="#pricing" style={styles.announcementLink}>See pricing →</a>
        </span>
      </div> */}

      {/* ── Main nav row ── */}
      <div style={styles.navInner}>

        {/* Logo */}
        <a href="#" style={styles.navLogo}>
          <span style={{ fontSize: "1.5rem" }}>🌱</span>
          <span style={styles.navLogoText}>Ai Farm</span>
        </a>

        {/* Desktop links */}
        <div style={styles.navLinks}>
          {NAV_LINKS.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} style={styles.navLink}>
              {l}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div style={styles.navActions}>
          <div style={styles.navLiveBadge}>
            <span style={styles.liveDot} />
            <span style={styles.navLiveBadgeText}>IoT Live</span>
          </div>
          <a href="/login" style={styles.navSignIn}>Sign In</a>
          <a href="/login" style={styles.navCta}>Request Access</a>
        </div>

        {/* Hamburger — shown on mobile via CSS would need media query; kept for logic */}
        <button onClick={() => setOpen(!open)} style={styles.hamburger} aria-label="Toggle menu">
          <span style={{ ...styles.hamburgerLine, transform: open ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ ...styles.hamburgerLine, opacity: open ? 0 : 1 }} />
          <span style={{ ...styles.hamburgerLine, transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {open && (
        <div style={styles.mobileMenu}>
          {NAV_LINKS.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} style={styles.mobileLink} onClick={() => setOpen(false)}>
              {l}
            </a>
          ))}
          <div style={styles.mobileDivider} />
          <a href="/login" style={styles.mobileLink}>Sign In</a>
          <a href="/login" style={{ ...styles.mobileLink, color: C.gold, fontWeight: 700 }}>Request Access →</a>
        </div>
      )}
    </nav>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, tag, tagColor, tagBg }) {
  return (
    <div style={styles.featureCard}>
      <div style={styles.featureIconWrap}>{icon}</div>
      <span style={{ ...styles.featureTag, color: tagColor, background: tagBg }}>{tag}</span>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc, last }) {
  return (
    <div style={styles.stepRow}>
      <div style={styles.stepLeft}>
        <div style={styles.stepNum}>{num}</div>
        {!last && <div style={styles.stepLine} />}
      </div>
      <div style={styles.stepContent}>
        <h3 style={styles.stepTitle}>{title}</h3>
        <p style={styles.stepDesc}>{desc}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, avatar, quote }) {
  return (
    <div style={styles.testimonialCard}>
      <p style={styles.testimonialQuote}>"{quote}"</p>
      <div style={styles.testimonialAuthor}>
        <span style={styles.testimonialAvatar}>{avatar}</span>
        <div>
          <p style={styles.testimonialName}>{name}</p>
          <p style={styles.testimonialRole}>{role}</p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, desc, features, cta, highlight }) {
  return (
    <div style={{ ...styles.pricingCard, ...(highlight ? styles.pricingHighlight : {}) }}>
      {highlight && <div style={styles.popularBadge}>Most Popular</div>}
      <h3 style={{ ...styles.pricingName, color: highlight ? "#fff" : C.textDark }}>{name}</h3>
      <p style={{ ...styles.pricingDesc, color: highlight ? "rgba(255,255,255,0.6)" : C.textMuted }}>{desc}</p>
      <div style={styles.pricingPriceRow}>
        <span style={{ ...styles.pricingPrice, color: highlight ? C.gold : C.textDark }}>{price}</span>
        {period && <span style={{ ...styles.pricingPeriod, color: highlight ? "rgba(255,255,255,0.5)" : C.textMuted }}>{period}</span>}
      </div>
      <ul style={styles.pricingFeatures}>
        {features.map((f) => (
          <li key={f} style={{ ...styles.pricingFeatureItem, color: highlight ? "rgba(255,255,255,0.85)" : C.textDark }}>
            <span style={{ color: highlight ? C.gold : C.green }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <button style={{ ...styles.pricingCta, ...(highlight ? styles.pricingCtaHighlight : {}) }}>
        {cta}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // ✅ FIX 2: scrolled now actually updates via useEffect + scroll listener
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={styles.page}>
      <Navbar scrolled={scrolled} />

      {/* ── HERO ── */}
      <section style={styles.hero}>
        {/* Farm bg image with dark overlay */}
        <div style={styles.heroBgOverlay} />

        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <span style={styles.heroBadge}>🚀 Now with Disease Mapping AI</span>
            <h1 style={styles.heroH1}>
              Crop Intelligence<br />
              <span style={styles.heroGold}>for Modern Farmers</span>
            </h1>
            <p style={styles.heroP}>
              Ai Farm brings real-time AI crop detection, soil health monitoring, and<br></br>get personalized treatment recommendations — all in one platform.
            </p>
            <div style={styles.heroButtons}>
              <a href="#pricing" style={styles.heroBtnPrimary}>Start Free Trial →</a>
              {/* <a href="#how-it-works" style={styles.heroBtnSecondary}>Watch Demo</a> */}
            </div>
            {/* <div style={styles.heroMeta}>
              <span style={styles.liveDot} />
              <span style={styles.heroMetaText}>IoT sync · Live · 500+ farms active</span>
            </div> */}
          </div>

          {/* Floating farm stats card */}
          <div style={styles.heroRight}>
            <div style={styles.farmStatsCard}>
              <div style={styles.farmStatsHeader}>
                <span style={styles.liveDot} />
                <span style={styles.farmStatsHeaderText}>Live · Kota Kinabalu Farm</span>
              </div>
              <div style={styles.farmStatsGrid}>
                {[
                  { icon: "🍎", label: "Fruits Detected", value: "1,248", color: C.gold },
                  { icon: "✅", label: "Healthy Batches", value: "4 / 6", color: C.green },
                  { icon: "💧", label: "Soil Moisture", value: "61%", color: C.gold },
                  { icon: "⚠️", label: "Active Alerts", value: "2", color: C.red },
                ].map((s) => (
                  <div key={s.label} style={styles.farmStatItem}>
                    <span style={styles.farmStatIcon}>{s.icon}</span>
                    <div>
                      <p style={styles.farmStatLabel}>{s.label}</p>
                      <p style={{ ...styles.farmStatValue, color: s.color }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={styles.statsStrip}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ ...styles.statItem, borderRight: i < STATS.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={styles.statValue}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>PLATFORM FEATURES</p>
          <h2 style={styles.sectionTitle}>Everything your farm needs</h2>
          <p style={styles.sectionSub}>From soil to harvest — AI-powered intelligence at every step of the crop lifecycle.</p>
          <div style={styles.featuresGrid}>
            {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ ...styles.section, background: C.sidebarBg }}>
        <div style={styles.sectionInner}>
          <p style={{ ...styles.eyebrow, color: C.gold }}>HOW IT WORKS</p>
          <h2 style={{ ...styles.sectionTitle, color: "#fff" }}>Up and running in 4 steps</h2>
          <div style={styles.stepsGrid}>
            <div style={styles.stepsLeft}>
              {STEPS.map((s, i) => (
                <StepCard key={s.num} {...s} last={i === STEPS.length - 1} />
              ))}
            </div>
            <div style={styles.stepsRight}>
              <div style={styles.stepsIllustration}>
                <span style={{ fontSize: "5rem" }}>🌾</span>
                <p style={styles.stepsIllustrationText}>Your smart farm,<br /><span style={{ color: C.gold }}>always online.</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>FARMER STORIES</p>
          <h2 style={styles.sectionTitle}>Trusted by farmers across Sabah</h2>
          <div style={styles.testimonialsGrid}>
            {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ ...styles.section, background: "#e8e4dc" }}>
        <div style={styles.sectionInner}>
          <p style={styles.eyebrow}>PRICING</p>
          <h2 style={styles.sectionTitle}>Simple, transparent pricing</h2>
          <p style={styles.sectionSub}>Start free, scale as your farm grows. No hidden fees.</p>
          <div style={styles.pricingGrid}>
            {PLANS.map((p) => <PricingCard key={p.name} {...p} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={styles.ctaBanner}>

        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>Ready to farm smarter?</h2>
          <p style={styles.ctaSub}>Join 500+ farms already using Ai Farm across Malaysia.</p>
          <div style={styles.ctaButtons}>
            <a href="#pricing" style={styles.heroBtnPrimary}>Start Free Trial →</a>
            {/* <a href="#" style={{ ...styles.heroBtnSecondary, borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>Talk to Sales</a> */}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="about" style={styles.footer}>
        {/* <div style={styles.footerTop}>
          <div>
            <div style={styles.footerLogo}>
              <span style={{ fontSize: "1.4rem" }}>🌱</span>
              <span style={styles.footerLogoText}>Ai Farm</span>
            </div>
            <p style={styles.footerTagline}>Crop intelligence for modern Malaysian farmers.</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={styles.liveDot} />
              <span style={{ fontSize: "0.72rem", color: "#5a5040" }}>IoT sync · Live</span>
            </div>
          </div>
          {[
            { heading: "Platform", links: ["Dashboard", "Features", "Disease Map", "Soil Health", "Analytics"] },
            { heading: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
            { heading: "Support", links: ["Documentation", "API Reference", "Status", "Privacy", "Terms"] },
          ].map((col) => (
            <div key={col.heading} style={styles.footerCol}>
              <p style={styles.footerColHead}>{col.heading}</p>
              {col.links.map((l) => <a key={l} href="#" style={styles.footerLink}>{l}</a>)}
            </div>
          ))}
        </div> */}
        <div>
          <p style={styles.footerCredit}>© 2026 Ai Farm · All rights reserved</p>
          {/* <p style={styles.footerCredit}>Built for Malaysian farmers 🇲🇾</p> */}
        </div>
      </footer>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: { fontFamily: "'Georgia', serif", background: C.contentBg, color: C.textDark, overflowX: "hidden", width: "100vw", margin: 0, padding: 0, display: "flex", flexDirection: "column", boxSizing: "border-box" },

  // Navbar
  navbar: { position: "fixed", top: 0, left: 0, width: "100%", zIndex: 100, transition: "all 0.3s ease" },

  announcementBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.38rem 1rem", background: "rgba(200,151,58,0.1)", borderBottom: "1px solid rgba(200,151,58,0.15)" },
  announcementText: { fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontFamily: "'Segoe UI', sans-serif" },
  announcementLink: { color: C.gold, textDecoration: "none", fontWeight: 700 },

  navInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: "2rem", padding: "0 1.5rem" },
  navLogo: { display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "auto", textDecoration: "none" },
  navLogoText: { fontSize: "1.2rem", fontWeight: 700, color: "#fff", fontFamily: "'Georgia', serif" },
  navLinks: { display: "flex", gap: "1.75rem" },
  navLink: { fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontFamily: "'Segoe UI', sans-serif", letterSpacing: "0.02em" },
  navActions: { display: "flex", alignItems: "center", gap: "1rem" },
  navLiveBadge: { display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "999px", padding: "0.25rem 0.75rem" },
  navLiveBadgeText: { fontSize: "0.72rem", color: "#4ade80", fontFamily: "'Segoe UI', sans-serif", fontWeight: 600 },
  navSignIn: { fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontFamily: "'Segoe UI', sans-serif" },
  navCta: { fontSize: "0.82rem", background: C.gold, color: C.sidebarBg, padding: "0.45rem 1.1rem", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontFamily: "'Segoe UI', sans-serif" },

  hamburger: { display: "flex", flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 4 },
  hamburgerLine: { display: "block", width: 22, height: 2, background: "rgba(255,255,255,0.8)", borderRadius: 2, transition: "transform 0.25s, opacity 0.25s" },
  mobileMenu: { background: "rgba(28,31,22,0.98)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" },
  mobileLink: { padding: "0.65rem 0", fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", textDecoration: "none", fontFamily: "'Segoe UI', sans-serif", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  mobileDivider: { height: 1, background: "rgba(255,255,255,0.08)", margin: "0.5rem 0" },

  // Hero — full bleed farm photo background
  hero: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    left: "50%",
    right: "50%",
    marginLeft: "-50%",
    marginRight: "-50%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxSizing: "border-box",
    backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=85')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
  // Dark gradient overlay so text stays readable
  heroBgOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to right, rgba(20,23,14,0.92) 0%, rgba(20,23,14,0.75) 50%, rgba(20,23,14,0.45) 100%)",
    zIndex: 0,
    pointerEvents: "none",
  },

  heroInner: { position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "9rem 2rem 5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "4rem", width: "100%", boxSizing: "border-box" },
  heroLeft: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  // heroRight:   {flex: 1, minWidth: 0, display: "flex", justifyContent: "center", alignItems: "center", width: "100%"},
  heroBadge: { display: "inline-block", background: "rgba(200,151,58,0.15)", color: C.gold, border: "1px solid rgba(200,151,58,0.3)", borderRadius: "999px", padding: "0.3rem 1rem", fontSize: "0.78rem", fontFamily: "'Segoe UI', sans-serif", marginBottom: "1.5rem" },
  heroH1: { fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: "0 0 1.25rem" },
  heroGold: { color: C.gold },
  heroP: { fontSize: "1rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, fontFamily: "'Segoe UI', sans-serif", maxWidth: 600, margin: "0 0 2rem", textAlign: "center" },
  heroButtons: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.5rem" },
  heroBtnPrimary: { background: C.gold, color: C.sidebarBg, padding: "0.85rem 2rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontFamily: "'Segoe UI', sans-serif", fontSize: "0.95rem" },
  heroBtnSecondary: { background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.9)", padding: "0.85rem 2rem", borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontFamily: "'Segoe UI', sans-serif", fontSize: "0.95rem", border: "1px solid rgba(255,255,255,0.25)" },
  heroMeta: { display: "flex", alignItems: "center", gap: "0.5rem" },
  heroMetaText: { fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Segoe UI', sans-serif" },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 },

  // Floating stats card (right side)
  heroRight: { flex: 1, minWidth: 0, display: "flex", justifyContent: "center" },
  farmStatsCard: {
    background: "rgba(20,23,14,0.7)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(200,151,58,0.25)",
    borderRadius: "20px",
    padding: "1.75rem",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  farmStatsHeader: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center", padding: "1rem" },
  farmStatsHeaderText: { fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontFamily: "'Segoe UI', sans-serif", letterSpacing: "0.04em" },
  farmStatsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center", justifyContent: "center" },
  farmStatItem: { display: "flex", alignItems: "center", gap: "0.65rem", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "0.85rem" },
  farmStatIcon: { fontSize: "1.5rem", flexShrink: 0 },
  farmStatLabel: { fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Segoe UI', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.2rem" },
  farmStatValue: { fontSize: "1.2rem", fontWeight: 800, margin: 0, lineHeight: 1 },

  statsStrip: { background: "#fff", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "center" },
  statItem: { flex: 1, maxWidth: 220, padding: "2rem 2.5rem", textAlign: "center" },
  statValue: { display: "block", fontSize: "2rem", fontWeight: 700, color: C.gold, marginBottom: "0.3rem" },
  statLabel: { display: "block", fontSize: "0.78rem", color: C.textMuted, fontFamily: "'Segoe UI', sans-serif", letterSpacing: "0.04em" },

  section: { width: "100%", padding: "5rem 2rem", display: "flex", justifyContent: "center" },
  sectionInner: { width: "100%", maxWidth: 1200, padding: "0 2rem", margin: "0 auto" },
  eyebrow: { fontSize: "0.68rem", letterSpacing: "0.2em", color: C.gold, fontFamily: "'Segoe UI', sans-serif", textAlign: "center", margin: "0 0 0.75rem" },
  sectionTitle: { fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 700, color: C.textDark, textAlign: "center", margin: "0 0 0.75rem" },
  sectionSub: { fontSize: "1rem", color: C.textMuted, fontFamily: "'Segoe UI', sans-serif", lineHeight: 1.7, maxWidth: "100%", textAlign: "center", margin: "0 auto 3rem", width: "100%" },

  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" },
  featureCard: { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "1.75rem" },
  featureIconWrap: { fontSize: "2rem", marginBottom: "0.75rem" },
  featureTag: { display: "inline-block", fontSize: "0.68rem", fontWeight: 700, borderRadius: "999px", padding: "0.2rem 0.7rem", marginBottom: "0.75rem", fontFamily: "'Segoe UI', sans-serif" },
  featureTitle: { fontSize: "1.05rem", fontWeight: 700, color: C.textDark, margin: "0 0 0.5rem" },
  featureDesc: { fontSize: "0.88rem", color: C.textMuted, lineHeight: 1.7, fontFamily: "'Segoe UI', sans-serif", margin: 0 },

  stepsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" },
  stepsLeft: { display: "flex", flexDirection: "column" },
  stepRow: { display: "flex", gap: "1.5rem", marginBottom: "0.5rem" },
  stepLeft: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 },
  stepNum: { width: 48, height: 48, borderRadius: "50%", background: "rgba(200,151,58,0.15)", border: `1px solid rgba(200,151,58,0.3)`, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, fontFamily: "'Segoe UI', sans-serif", flexShrink: 0 },
  stepLine: { flex: 1, width: 1, background: "rgba(255,255,255,0.08)", margin: "0.5rem 0" },
  stepContent: { paddingBottom: "2rem" },
  stepTitle: { fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0.7rem 0 0.4rem" },
  stepDesc: { fontSize: "0.88rem", color: "#7a7060", lineHeight: 1.7, fontFamily: "'Segoe UI', sans-serif", margin: 0 },
  stepsRight: { display: "flex", justifyContent: "center" },
  stepsIllustration: { background: "rgba(200,151,58,0.07)", border: "1px solid rgba(200,151,58,0.15)", borderRadius: "20px", padding: "3rem", textAlign: "center" },
  stepsIllustrationText: { fontSize: "1.3rem", color: "#fff", fontWeight: 700, marginTop: "1rem", lineHeight: 1.4 },

  testimonialsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" },
  testimonialCard: { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "2rem" },
  testimonialQuote: { fontSize: "0.95rem", color: C.textDark, lineHeight: 1.75, fontStyle: "italic", margin: "0 0 1.5rem" },
  testimonialAuthor: { display: "flex", alignItems: "center", gap: "0.75rem" },
  testimonialAvatar: { fontSize: "2rem" },
  testimonialName: { fontSize: "0.9rem", fontWeight: 700, color: C.textDark, margin: 0 },
  testimonialRole: { fontSize: "0.75rem", color: C.textMuted, fontFamily: "'Segoe UI', sans-serif", margin: 0 },

  pricingGrid: { display: "flex", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem", alignItems: "center", justifyContent: "center" },
  pricingCard: { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "2rem", position: "relative" },
  pricingHighlight: { background: C.sidebarBg, border: `1px solid rgba(200,151,58,0.3)` },
  popularBadge: { position: "absolute", top: "-0.75rem", left: "50%", transform: "translateX(-50%)", background: C.gold, color: C.sidebarBg, fontSize: "0.72rem", fontWeight: 700, borderRadius: "999px", padding: "0.25rem 0.9rem", fontFamily: "'Segoe UI', sans-serif", whiteSpace: "nowrap" },
  pricingName: { fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem" },
  pricingDesc: { fontSize: "0.82rem", fontFamily: "'Segoe UI', sans-serif", margin: "0 0 1.25rem" },
  pricingPriceRow: { display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "1.5rem" },
  pricingPrice: { fontSize: "2rem", fontWeight: 700 },
  pricingPeriod: { fontSize: "0.85rem", fontFamily: "'Segoe UI', sans-serif" },
  pricingFeatures: { listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" },
  pricingFeatureItem: { fontSize: "0.88rem", fontFamily: "'Segoe UI', sans-serif", display: "flex", gap: "0.5rem" },
  pricingCta: { width: "100%", padding: "0.85rem", borderRadius: "10px", border: `1.5px solid ${C.border}`, background: "transparent", color: C.textDark, fontWeight: 700, fontFamily: "'Segoe UI', sans-serif", cursor: "pointer", fontSize: "0.9rem" },
  pricingCtaHighlight: { background: C.gold, border: "none", color: C.sidebarBg },

  ctaBanner: { background: C.sidebarBg, padding: "5rem 2rem", textAlign: "center", position: "relative", overflow: "hidden" },

  ctaInner: { position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" },
  ctaTitle: { fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#fff", margin: "0 0 1rem" },
  ctaSub: { fontSize: "1rem", color: "#7a7060", fontFamily: "'Segoe UI', sans-serif", margin: "0 0 2.5rem" },
  ctaButtons: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },

  footer: { background: "#141710", padding: "2rem 2rem" },
  footerTop: { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" },
  footerLogo: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" },
  footerLogoText: { fontSize: "1.1rem", fontWeight: 700, color: "#fff" },
  footerTagline: { fontSize: "0.85rem", color: "#5a5040", fontFamily: "'Segoe UI', sans-serif", lineHeight: 1.6, margin: "0 0 1rem" },
  footerCol: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  footerColHead: { fontSize: "0.72rem", letterSpacing: "0.15em", color: C.gold, fontFamily: "'Segoe UI', sans-serif", margin: "0 0 0.5rem", textTransform: "uppercase" },
  footerLink: { fontSize: "0.85rem", color: "#5a5040", textDecoration: "none", fontFamily: "'Segoe UI', sans-serif" },
  footerBottom: { maxWidth: 1200, margin: "0 auto", borderTop: "1px solid #2a2d20", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" },
  footerCredit: { fontSize: "0.75rem", color: "#fff", fontFamily: "'Segoe UI', sans-serif", margin: 0 },
};