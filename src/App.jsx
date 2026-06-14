import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Palette: deep space dark + Instagram coral/purple gradient + electric pink accent
// Type: "Sora" display (weight 800) + "Inter" body
// Signature: animated gradient score ring + before/after comparison card

const GOOGLE_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
`;

const STYLES = `
  ${GOOGLE_FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a26;
    --surface3: #22223a;
    --border: rgba(255,255,255,0.07);
    --coral: #f7644a;
    --purple: #9b5de5;
    --pink: #e040fb;
    --gold: #ffd166;
    --green: #06d6a0;
    --text: #f0f0f8;
    --muted: #888899;
    --grad: linear-gradient(135deg, #f7644a 0%, #e040fb 50%, #9b5de5 100%);
    --grad2: linear-gradient(135deg, #9b5de5 0%, #e040fb 100%);
    font-family: 'Inter', sans-serif;
  }
  body { background: var(--bg); color: var(--text); }
  .sora { font-family: 'Sora', sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .fade-up { animation: fadeUp .4s ease forwards; }
`;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const viralByCategory = [
  { name: "Fashion", rate: 28.5 }, { name: "Music", rate: 25.6 },
  { name: "Entertainment", rate: 25.3 }, { name: "Travel", rate: 25.1 },
  { name: "Fitness", rate: 24.8 }, { name: "Food", rate: 24.5 },
  { name: "Technology", rate: 24.2 }, { name: "Education", rate: 24.0 },
  { name: "Business", rate: 23.9 }, { name: "Lifestyle", rate: 23.8 }
];
const viralByMedia = [
  { name: "Image", rate: 25.3 }, { name: "Carousel", rate: 24.9 }, { name: "Reel", rate: 24.7 }
];
const viralByHour = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  rate: h === 2 ? 27.2 : h === 9 ? 26.1 : h === 12 ? 25.8 : h === 18 ? 25.5 : 23 + Math.random() * 2
}));
const viralByDay = [
  { day: "Mon", rate: 24.3 }, { day: "Tue", rate: 25.6 }, { day: "Wed", rate: 24.3 },
  { day: "Thu", rate: 24.5 }, { day: "Fri", rate: 24.8 }, { day: "Sat", rate: 25.1 }, { day: "Sun", rate: 25.6 }
];
const modelPerf = [
  { model: "Gradient Boosting", auc: 0.9943, acc: 0.967, f1: 0.9346 },
  { model: "Random Forest", auc: 0.9928, acc: 0.9647, f1: 0.9295 },
  { model: "SVM (RBF)", auc: 0.9816, acc: 0.9517, f1: 0.9038 },
  { model: "Logistic Regression", auc: 0.9689, acc: 0.941, f1: 0.8768 }
];
const featureImportance = [
  { feat: "engagement_rate", val: 0.5319 }, { feat: "save_rate", val: 0.1804 },
  { feat: "share_rate", val: 0.0979 }, { feat: "comment_rate", val: 0.0531 },
  { feat: "reach_ratio", val: 0.0393 }, { feat: "engagement/follower", val: 0.0236 },
  { feat: "log_reach", val: 0.0139 }, { feat: "caption_length", val: 0.0105 },
  { feat: "log_followers", val: 0.0085 }, { feat: "post_hour", val: 0.0077 }
];

// ─── VIRAL SCORING ENGINE (rule-based mirroring research findings) ─────────────
function computeViralScore(inputs) {
  let score = 38; // base
  // Media type
  if (inputs.mediaType === "carousel") score += 8;
  else if (inputs.mediaType === "reel") score += 5;
  else score += 6;
  // Category
  const catBonus = { fashion: 12, music: 8, entertainment: 7, travel: 6, fitness: 5, food: 5, technology: 4, education: 4, business: 3, lifestyle: 2 };
  score += (catBonus[inputs.category] || 4);
  // Account
  if (inputs.accountType === "creator") score += 4; else score += 2;
  // Followers
  const f = parseInt(inputs.followers) || 0;
  if (f > 100000) score += 8; else if (f > 10000) score += 5; else if (f > 1000) score += 3; else score += 1;
  // Hour
  const h = parseInt(inputs.postHour) || 0;
  if (h === 2 || h === 9) score += 6; else if (h >= 17 && h <= 21) score += 4; else if (h >= 0 && h <= 6) score += 1; else score += 3;
  // Day
  const dayBonus = { tuesday: 5, sunday: 5, saturday: 4, friday: 3, monday: 2, wednesday: 2, thursday: 2 };
  score += (dayBonus[inputs.dayOfWeek] || 2);
  // Caption
  const cl = parseInt(inputs.captionLength) || 0;
  if (cl >= 100 && cl <= 300) score += 5; else if (cl >= 50) score += 3; else score += 1;
  // Hashtags
  const ht = parseInt(inputs.hashtagCount) || 0;
  if (ht >= 5 && ht <= 10) score += 6; else if (ht >= 11 && ht <= 15) score += 3; else if (ht > 20) score += 1; else score += 4;
  // CTA
  if (inputs.cta === "yes") score += 7;
  return Math.min(Math.max(score, 10), 98);
}

function getLabel(score) {
  if (score < 40) return { label: "Low Potential", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  if (score < 60) return { label: "Average", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  if (score < 80) return { label: "Good Potential", color: "#06d6a0", bg: "rgba(6,214,160,0.12)" };
  return { label: "Highly Viral ✦", color: "#e040fb", bg: "rgba(224,64,251,0.12)" };
}

function getOptimizedParams(inputs) {
  const optimized = { ...inputs };
  // Fix low-performing choices
  if (inputs.mediaType === "reel" || inputs.mediaType === "image") optimized.mediaType = "carousel";
  const ht = parseInt(inputs.hashtagCount) || 0;
  if (ht < 5 || ht > 15) optimized.hashtagCount = "7";
  if (inputs.cta !== "yes") optimized.cta = "yes";
  const h = parseInt(inputs.postHour) || 0;
  if (h !== 2 && h !== 9) optimized.postHour = "9";
  if (inputs.dayOfWeek !== "tuesday" && inputs.dayOfWeek !== "sunday") optimized.dayOfWeek = "tuesday";
  if (inputs.category === "lifestyle") optimized.category = "fashion";
  const cl = parseInt(inputs.captionLength) || 0;
  if (cl < 100) optimized.captionLength = "150";
  return optimized;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function GradientText({ children, style = {} }) {
  return (
    <span style={{ background: "var(--grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", ...style }}>
      {children}
    </span>
  );
}

function ScoreRing({ score, size = 160 }) {
  const r = size / 2 - 16;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const { color } = getLabel(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: `drop-shadow(0 0 16px ${color}55)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7644a" />
          <stop offset="50%" stopColor="#e040fb" />
          <stop offset="100%" stopColor="#9b5de5" />
        </linearGradient>
      </defs>
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill={color} fontSize="32" fontWeight="800" fontFamily="Sora,sans-serif">{score}%</text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fill="var(--muted)" fontSize="11" fontFamily="Inter,sans-serif">Viral Score</text>
    </svg>
  );
}

function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
      padding: 24, ...(glow ? { boxShadow: "0 0 32px rgba(224,64,251,0.08)" } : {}), ...style
    }}>
      {children}
    </div>
  );
}

function Tag({ children, color = "var(--purple)" }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em"
    }}>{children}</span>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10,
        color: "var(--text)", padding: "10px 14px", fontSize: 14, outline: "none",
        appearance: "none", cursor: "pointer"
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10,
        color: "var(--text)", padding: "10px 14px", fontSize: 14, outline: "none",
        fontFamily: "Inter, sans-serif"
      }} />
    </div>
  );
}

function GradBtn({ children, onClick, loading, secondary, style = {} }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      background: secondary ? "var(--surface3)" : "var(--grad)",
      color: secondary ? "var(--text)" : "#fff",
      border: secondary ? "1px solid var(--border)" : "none",
      borderRadius: 12, padding: "13px 28px", fontWeight: 700, fontSize: 15,
      cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
      fontFamily: "Sora, sans-serif", letterSpacing: "0.01em",
      transition: "transform .15s, box-shadow .15s",
      ...style
    }}
      onMouseEnter={e => { if (!loading) { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 24px rgba(224,64,251,0.3)"; } }}
      onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = ""; }}
    >
      {loading ? "⏳ Analyzing…" : children}
    </button>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function Landing({ onNav }) {
  const mockMetrics = [
    { label: "Viral Score", value: "87%", icon: "🔥" },
    { label: "Confidence", value: "High", icon: "✦" },
    { label: "Best Hour", value: "9:00", icon: "⏰" },
    { label: "Predicted Reach", value: "+340%", icon: "📈" }
  ];
  const features = [
    { icon: "🧠", title: "AI Viral Scoring", desc: "Machine Learning model trained on 30K Instagram posts classifies your content's viral potential before you post." },
    { icon: "⚡", title: "Optimization Engine", desc: "When your score is below 80%, the engine suggests specific parameter changes - with projected score improvements." },
    { icon: "📊", title: "Research Analytics", desc: "Explore interactive charts from real EDA: viral rates by category, media type, posting hour, and feature importance." },
    { icon: "🤖", title: "OpenAI Advisor", desc: "Get deep, contextual content strategy advice powered by OpenAI - not just data, but actionable creative guidance." }
  ];
  const stats = [
    { n: "29,999", label: "Training posts" },
    { n: "99.4%", label: "Best AUC-ROC" },
    { n: "4", label: "ML algorithms compared" },
    { n: "19", label: "Input features" }
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", position: "relative", overflow: "hidden" }}>
        {/* Ambient blobs */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,64,251,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,100,74,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <Tag color="var(--purple)">CTE3103 Final Project · Nguyễn Hải Anh</Tag>
            </div>
            <h1 className="sora" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
              Predict Your Next<br />
              <GradText>Viral Instagram Post</GradText>
            </h1>
            <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              ML-powered platform for marketers and creators - score your content's viral potential and get AI-driven optimization advice before you publish.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <GradBtn onClick={() => onNav("predictor")}>Start Prediction →</GradBtn>
              <GradBtn secondary onClick={() => onNav("analytics")}>View Analytics</GradBtn>
            </div>
            <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
              {stats.map(s => (
                <div key={s.n}>
                  <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock dashboard card */}
          <div>
            <Card glow style={{ background: "linear-gradient(135deg, #12121a 0%, #1a1128 100%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span className="sora" style={{ fontWeight: 700, fontSize: 15 }}>Prediction Result</span>
                <Tag color="var(--pink)">Highly Viral ✦</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <ScoreRing score={87} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {mockMetrics.map(m => (
                  <div key={m.label} style={{ background: "var(--surface3)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 18 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{m.label}</div>
                    <div className="sora" style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="sora" style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
            Built on <GradText>Real ML Research</GradText>
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
            Every prediction is grounded in findings from a full academic ML pipeline - EDA, SVM, PCA, K-Means, and regression.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {features.map(f => (
            <Card key={f.title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 28 }}>{f.icon}</span>
              <h3 className="sora" style={{ fontSize: 17, fontWeight: 700 }}>{f.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Insights strip */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "48px 24px", marginTop: 32 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h3 className="sora" style={{ fontSize: 22, fontWeight: 700, marginBottom: 28 }}>Key Research Findings</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { icon: "💾", stat: "Save & Share Rate", desc: "are the #1 predictors of virality - far above hashtags or caption length." },
              { icon: "👗", stat: "Fashion category", desc: "leads with 28.5% viral rate, trailed by Music (25.6%) and Entertainment." },
              { icon: "🕑", stat: "2 AM posting", desc: "peaks at 27.2% viral rate - aligns with 9 AM Vietnam time (UTC+7)." },
              { icon: "📸", stat: "Carousel format", desc: "drives deeper engagement than single images or Reels in this dataset." }
            ].map(i => (
              <div key={i.stat} style={{ background: "var(--surface2)", borderRadius: 12, padding: 18, borderLeft: "3px solid var(--purple)" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{i.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{i.stat}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{i.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// helper to avoid JSX naming issue
function GradText({ children }) { return <GradientText>{children}</GradientText>; }

// ─── PREDICTOR PAGE ───────────────────────────────────────────────────────────
function Predictor() {
  const [inputs, setInputs] = useState({
    mediaType: "carousel", category: "fashion", accountType: "creator",
    followers: "10000", postHour: "9", dayOfWeek: "tuesday",
    captionLength: "150", hashtagCount: "7", cta: "yes"
  });
  const [result, setResult] = useState(null);
  const [optimized, setOptimized] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [optimizeLoading, setOptimizeLoading] = useState(false);

  const set = k => v => setInputs(p => ({ ...p, [k]: v }));

  const predict = () => {
    setLoading(true);
    setResult(null); setOptimized(null); setAiAdvice("");
    setTimeout(() => {
      const score = computeViralScore(inputs);
      setResult({ score, ...getLabel(score), confidence: score > 70 ? "High" : score > 50 ? "Medium" : "Low" });
      setLoading(false);
    }, 800);
  };

  const optimize = async () => {
    if (!result) return;
    setOptimizeLoading(true);
    const opt = getOptimizedParams(inputs);
    const optScore = computeViralScore(opt);
    setTimeout(() => {
      setOptimized({ params: opt, score: optScore, ...getLabel(optScore) });
      setOptimizeLoading(false);
    }, 700);
  };

  const getAIAdvice = async () => {
    if (!result) return;

    setAiLoading(true);
    setAiAdvice("");
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, result }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not generate advice.");
      }

      setAiAdvice(data.advice || "Could not generate advice.");
    } catch (error) {
      console.error(error);
      setAiAdvice(error.message || "AI advice unavailable. Please check the server.");
    }
    setAiLoading(false);
  };

  const { label: resultLabel, color: resultColor } = result ? getLabel(result.score) : {};

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 36 }}>
        <h2 className="sora" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Viral <GradText>Predictor</GradText></h2>
        <p style={{ color: "var(--muted)" }}>Enter your post parameters to get a pre-publish viral score.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Form */}
        <Card>
          <h3 className="sora" style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Post Parameters</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Select label="Media Type" value={inputs.mediaType} onChange={set("mediaType")}
              options={[{ value: "image", label: "📷 Image" }, { value: "carousel", label: "🗂 Carousel" }, { value: "reel", label: "🎬 Reel" }]} />
            <Select label="Content Category" value={inputs.category} onChange={set("category")}
              options={["fashion","music","food","travel","lifestyle","education","technology","fitness","business","entertainment"].map(c => ({ value: c, label: c.charAt(0).toUpperCase()+c.slice(1) }))} />
            <Select label="Account Type" value={inputs.accountType} onChange={set("accountType")}
              options={[{ value: "brand", label: "🏢 Brand" }, { value: "creator", label: "👤 Creator" }]} />
            <Input label="Follower Count" value={inputs.followers} onChange={set("followers")} placeholder="e.g. 10000" type="number" />
            <Select label="Post Hour (UTC)" value={inputs.postHour} onChange={set("postHour")}
              options={Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2,"0")}:00` }))} />
            <Select label="Day of Week" value={inputs.dayOfWeek} onChange={set("dayOfWeek")}
              options={["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(d => ({ value: d, label: d.charAt(0).toUpperCase()+d.slice(1) }))} />
            <Input label="Caption Length (chars)" value={inputs.captionLength} onChange={set("captionLength")} placeholder="e.g. 150" type="number" />
            <Input label="Hashtag Count" value={inputs.hashtagCount} onChange={set("hashtagCount")} placeholder="e.g. 7" type="number" />
            <Select label="Call to Action" value={inputs.cta} onChange={set("cta")}
              options={[{ value: "yes", label: "✅ Yes, has CTA" }, { value: "no", label: "❌ No CTA" }]} />
          </div>
          <div style={{ marginTop: 24 }}>
            <GradBtn onClick={predict} loading={loading} style={{ width: "100%" }}>
              🔮 Predict Viral Score
            </GradBtn>
          </div>
        </Card>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {result ? (
            <Card glow className="fade-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 className="sora" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Prediction Result</h3>
                  <Tag color={resultColor}>{resultLabel}</Tag>
                </div>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Confidence: <strong style={{ color: "var(--text)" }}>{result.confidence}</strong></span>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <ScoreRing score={result.score} size={180} />
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>0%</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Low · Average · Good · Highly Viral</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>100%</span>
                </div>
                <div style={{ height: 8, background: "var(--surface3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${result.score}%`, height: "100%", background: "var(--grad)", borderRadius: 4, transition: "width 1s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4 }}>
                  {[40, 60, 80].map(t => (
                    <div key={t} style={{ height: 8, width: 1, background: "var(--border)", position: "relative", top: -14 }} />
                  ))}
                </div>
              </div>

              {/* Tier badges */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
                {[{r:"0–40%",l:"Low",c:"#ef4444"},{r:"40–60%",l:"Average",c:"#f59e0b"},{r:"60–80%",l:"Good",c:"#06d6a0"},{r:"80–100%",l:"Highly Viral",c:"#e040fb"}].map(t => (
                  <div key={t.l} style={{ background: result.label === t.l || (result.label.includes("Highly") && t.l === "Highly Viral") ? t.c+"22" : "var(--surface3)", borderRadius: 8, padding: "8px 4px", textAlign: "center", border: `1px solid ${result.label === t.l || (result.label.includes("Highly") && t.l === "Highly Viral") ? t.c : "transparent"}` }}>
                    <div style={{ fontSize: 10, color: t.c, fontWeight: 700 }}>{t.l}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{t.r}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {result.score < 80 && (
                  <GradBtn onClick={optimize} loading={optimizeLoading} style={{ flex: 1 }}>
                    ✨ Optimize My Post
                  </GradBtn>
                )}
                <GradBtn secondary onClick={getAIAdvice} loading={aiLoading} style={{ flex: 1 }}>
                  🤖 AI Strategy Advice
                </GradBtn>
              </div>
            </Card>
          ) : (
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
              <div style={{ fontSize: 48 }}>🔮</div>
              <p style={{ color: "var(--muted)", textAlign: "center" }}>Fill in your post parameters and click "Predict Viral Score" to get started.</p>
            </Card>
          )}

          {/* AI Advice */}
          {aiAdvice && (
            <Card className="fade-up" style={{ borderLeft: "3px solid var(--purple)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <span className="sora" style={{ fontWeight: 700, fontSize: 15 }}>OpenAI Strategy Advisor</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8 }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAdvice}</ReactMarkdown></div>
            </Card>
          )}
        </div>
      </div>

      {/* Before vs After */}
      {optimized && (
        <div className="fade-up" style={{ marginTop: 32 }}>
          <h3 className="sora" style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            ✨ <GradText>Optimization Results</GradText> - Before vs After
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "center" }}>
            <Card style={{ borderTop: "3px solid #ef4444" }}>
              <div className="sora" style={{ fontWeight: 700, marginBottom: 16, color: "#ef4444" }}>Current Setup</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <ScoreRing score={result.score} size={120} />
              </div>
              {[
                { k: "Media", v: inputs.mediaType },
                { k: "Hashtags", v: inputs.hashtagCount },
                { k: "CTA", v: inputs.cta },
                { k: "Post Hour", v: `${inputs.postHour}:00` },
                { k: "Day", v: inputs.dayOfWeek }
              ].map(r => (
                <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                  <span style={{ color: "var(--muted)" }}>{r.k}</span>
                  <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{r.v}</span>
                </div>
              ))}
            </Card>

            <div style={{ textAlign: "center", fontSize: 28 }}>→</div>

            <Card style={{ borderTop: "3px solid var(--green)" }}>
              <div className="sora" style={{ fontWeight: 700, marginBottom: 16, color: "var(--green)" }}>Optimized Setup</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <ScoreRing score={optimized.score} size={120} />
              </div>
              {[
                { k: "Media", cur: inputs.mediaType, opt: optimized.params.mediaType },
                { k: "Hashtags", cur: inputs.hashtagCount, opt: optimized.params.hashtagCount },
                { k: "CTA", cur: inputs.cta, opt: optimized.params.cta },
                { k: "Post Hour", cur: `${inputs.postHour}:00`, opt: `${optimized.params.postHour}:00` },
                { k: "Day", cur: inputs.dayOfWeek, opt: optimized.params.dayOfWeek }
              ].map(r => (
                <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                  <span style={{ color: "var(--muted)" }}>{r.k}</span>
                  <span style={{ fontWeight: 600, textTransform: "capitalize", color: r.cur !== r.opt ? "var(--green)" : "var(--text)" }}>
                    {r.opt} {r.cur !== r.opt ? "↑" : ""}
                  </span>
                </div>
              ))}
            </Card>
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>Projected improvement: </span>
            <span className="sora" style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>
              +{optimized.score - result.score}% → {optimized.score}% Viral Score
            </span>
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      {result && result.score < 80 && !optimized && (
        <Card className="fade-up" style={{ marginTop: 24, borderLeft: "3px solid var(--coral)" }}>
          <h4 className="sora" style={{ fontWeight: 700, marginBottom: 16, color: "var(--coral)" }}>⚠️ Optimization Suggestions</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              inputs.mediaType !== "carousel" && "Switch to Carousel format for higher engagement",
              inputs.cta !== "yes" && "Add a strong Call-to-Action to your caption",
              (parseInt(inputs.hashtagCount) > 15 || parseInt(inputs.hashtagCount) < 5) && "Use 5–10 hashtags (research sweet spot)",
              inputs.dayOfWeek !== "tuesday" && inputs.dayOfWeek !== "sunday" && "Post on Tuesday or Sunday for peak viral rates",
              parseInt(inputs.postHour) !== 2 && parseInt(inputs.postHour) !== 9 && "Post at 9:00 (Vietnam prime time / UTC 2:00)",
              parseInt(inputs.captionLength) < 100 && "Write a longer caption (100–300 chars is optimal)",
              inputs.category === "lifestyle" && "Consider Fashion or Music - higher inherent viral rates"
            ].filter(Boolean).map((tip, i) => (
              <div key={i} style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--muted)", display: "flex", gap: 8 }}>
                <span>💡</span><span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 14, fontWeight: 700, color: p.color || "var(--text)" }}>
          {typeof p.value === "number" ? p.value.toFixed(1) + "%" : p.value}
        </div>
      ))}
    </div>
  );
}

function Analytics() {
  const PURPLE = "#9b5de5"; const CORAL = "#f7644a"; const PINK = "#e040fb";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 36 }}>
        <h2 className="sora" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Research <GradText>Analytics</GradText></h2>
        <p style={{ color: "var(--muted)" }}>Interactive visualization of ML research findings from 29,999 Instagram posts.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Viral by Category */}
        <Card>
          <h3 className="sora" style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Viral Rate by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={viralByCategory} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[22, 30]} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={v => v + "%"} />
              <YAxis type="category" dataKey="name" tick={{ fill: "var(--muted)", fontSize: 11 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[0,4,4,0]}>
                {viralByCategory.map((e, i) => <Cell key={i} fill={i === 0 ? PINK : i === 1 ? PURPLE : CORAL} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Viral by Hour */}
        <Card>
          <h3 className="sora" style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Viral Rate by Posting Hour</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={viralByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: "var(--muted)", fontSize: 10 }} interval={3} />
              <YAxis domain={[22, 28]} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" stroke={PURPLE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Peak at 2:00 UTC (27.2%) - equiv. 9:00 Vietnam time</p>
        </Card>

        {/* Viral by Day */}
        <Card>
          <h3 className="sora" style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Viral Rate by Day of Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={viralByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis domain={[23, 26.5]} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[4,4,0,0]}>
                {viralByDay.map((e, i) => <Cell key={i} fill={e.day === "Tue" || e.day === "Sun" ? PINK : PURPLE} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Media Type */}
        <Card>
          <h3 className="sora" style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Viral Rate by Media Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={viralByMedia}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 13 }} />
              <YAxis domain={[24, 26]} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={v => v + "%"} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[4,4,0,0]}>
                {viralByMedia.map((e, i) => <Cell key={i} fill={[CORAL, PINK, PURPLE][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Image leads (25.3%) but Carousel excels in engagement depth.</p>
        </Card>

        {/* Feature Importance */}
        <Card>
          <h3 className="sora" style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Top Features (Random Forest)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={featureImportance} layout="vertical" margin={{ left: 32, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <YAxis type="category" dataKey="feat" tick={{ fill: "var(--muted)", fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="val" radius={[0,4,4,0]}>
                {featureImportance.map((e, i) => <Cell key={i} fill={i === 0 ? PINK : i < 3 ? PURPLE : CORAL} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Model Performance */}
        <Card>
          <h3 className="sora" style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>ML Model Performance (AUC-ROC)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {modelPerf.map((m, i) => (
              <div key={m.model}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{m.model}</span>
                  <span style={{ fontWeight: 700, color: [PINK, PURPLE, CORAL, "var(--muted)"][i] }}>{(m.auc * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${m.auc * 100}%`, height: "100%", background: [PINK, PURPLE, CORAL, "rgba(255,255,255,0.2)"][i], borderRadius: 3, transition: "width 1s ease" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 14, background: "var(--surface2)", borderRadius: 10, fontSize: 13, color: "var(--muted)" }}>
            🏆 <strong style={{ color: "var(--text)" }}>Gradient Boosting</strong> leads with AUC = 0.9943. SVM (RBF) was added in the final project, reaching AUC = 0.9816 - beating Logistic Regression baseline.
          </div>
        </Card>
      </div>

      {/* Insights Panel */}
      <Card style={{ marginTop: 24, background: "linear-gradient(135deg, #12121a 0%, #1a1128 100%)" }}>
        <h3 className="sora" style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
          📋 Research Insights Panel
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { icon: "📌", text: "Save Rate and Share Rate are the most influential predictors of viral potential - far outweighing surface-level signals." },
            { icon: "💡", text: "Shareable and bookmarkable content consistently outperforms content optimized only for likes or comments." },
            { icon: "🏷️", text: "Hashtag count and caption length have minimal predictive impact. Don't over-invest in them." },
            { icon: "🗂️", text: "Carousel posts generate deeper engagement loops than single images, despite Image slightly leading in raw viral rate." },
            { icon: "📉", text: "Ridge Regression failed (R² = −0.046), proving Instagram engagement is highly non-linear - validating the binary classification approach." },
            { icon: "🔵", text: "K-Means (K=4) unsupervised clustering naturally discovered a Viral cluster (76.2% viral rate) - confirming behavior patterns." }
          ].map((ins, i) => (
            <div key={i} style={{ background: "var(--surface3)", borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{ins.icon}</span>
              <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{ins.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");

  const navItems = [
    { id: "landing", label: "Home" },
    { id: "predictor", label: "Viral Predictor" },
    { id: "analytics", label: "Analytics" }
  ];

  return (
    <>
      <style>{STYLES}</style>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)", padding: "0 24px"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <button onClick={() => setPage("landing")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span className="sora" style={{ fontWeight: 800, fontSize: 20, background: "var(--grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ViralIQ
            </span>
          </button>
          <div style={{ display: "flex", gap: 4 }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                background: page === n.id ? "var(--surface2)" : "none",
                border: page === n.id ? "1px solid var(--border)" : "1px solid transparent",
                borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                color: page === n.id ? "var(--text)" : "var(--muted)",
                fontSize: 14, fontWeight: page === n.id ? 600 : 400,
                fontFamily: "Inter, sans-serif", transition: "all .15s"
              }}>{n.label}</button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      {page === "landing" && <Landing onNav={setPage} />}
      {page === "predictor" && <Predictor />}
      {page === "analytics" && <Analytics />}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 24px", marginTop: 64 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="sora" style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
              <GradientText>ViralIQ</GradientText>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Instagram Viral Strategy Advisor · CTE3103 · Final Project</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
            <div>Nguyễn Hải Anh · 24022939 · K69C-ID2</div>
            <div>Trường Đại học Công nghệ · Đại học Quốc gia Hà Nội · 2026</div>
          </div>
        </div>
      </footer>
    </>
  );
}
