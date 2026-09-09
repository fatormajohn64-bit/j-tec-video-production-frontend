import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL || "https://j-tec-video-production-backend.onrender.com";
const MAX_CHARS = 500;

const STYLES = [
  { id: "cinematic", name: "Cinematic", desc: "Epic & dramatic" },
  { id: "dark", name: "Dark", desc: "Moody & mysterious" },
  { id: "soft", name: "Soft", desc: "Peaceful & emotional" },
  { id: "colourful", name: "Colourful", desc: "Bright & energetic" },
  { id: "powerful", name: "Powerful", desc: "Strong & intense" },
];

export default function App() {
  const [isOnline, setIsOnline] = useState(null);
  const [quote, setQuote] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [phase, setPhase] = useState("idle"); // idle | generating | done | error
  const [statusText, setStatusText] = useState("");
  const [jobId, setJobId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((r) => setIsOnline(r.ok))
      .catch(() => setIsOnline(false));
    return () => clearInterval(pollRef.current);
  }, []);

  const startPolling = (id) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/videos/${id}`);
        const data = await res.json();
        setStatusText(data.status || "processing");
        if (data.status === "completed") {
          clearInterval(pollRef.current);
          setPhase("done");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current);
          setErrorMsg(data.message || "Video generation failed.");
          setPhase("error");
        }
      } catch (e) {
        clearInterval(pollRef.current);
        setErrorMsg("Lost connection while checking progress.");
        setPhase("error");
      }
    }, 2000);
  };

  const handleGenerate = async () => {
    const trimmed = quote.trim();
    if (!trimmed) {
      setErrorMsg("Enter a quote first.");
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setErrorMsg(`Keep it under ${MAX_CHARS} characters.`);
      return;
    }
    setErrorMsg("");
    setPhase("generating");
    setStatusText("queued");
    try {
      const res = await fetch(`${API_URL}/api/v1/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: trimmed, style }),
      });
      if (!res.ok) throw new Error("Server rejected the request.");
      const data = await res.json();
      setJobId(data.job_id);
      startPolling(data.job_id);
    } catch (e) {
      setErrorMsg("Couldn't reach the server. Try again.");
      setPhase("error");
    }
  };

  const reset = () => {
    setQuote("");
    setJobId(null);
    setStatusText("");
    setErrorMsg("");
    setPhase("idle");
  };

  const charsLeft = MAX_CHARS - quote.length;
  const countClass = charsLeft < 0 ? "limit" : charsLeft < 50 ? "warn" : "";
  const videoUrl = jobId ? `${API_URL}/api/v1/videos/${jobId}/file` : null;

  return (
    <div className="page">
      <div className="header">
        <div className="brand">
          <div className="brand-mark">J TEC</div>
          <div className="brand-sub">VIDEO PRODUCTION</div>
        </div>
        <div className="status">
          <span className={`status-dot ${isOnline === null ? "" : isOnline ? "online" : "offline"}`} />
          {isOnline === null ? "checking" : isOnline ? "online" : "offline"}
        </div>
      </div>

      {phase === "idle" || phase === "error" ? (
        <>
          <div className="hero">
            <h1>Turn a quote into a film.</h1>
            <p>Write a motivational line, pick a mood, and we'll cut it into a cinematic vertical short.</p>
          </div>

          <div className="card">
            <label className="field-label">Your quote</label>
            <textarea
              className="quote-input"
              placeholder="Never give up. Your time is coming."
              value={quote}
              maxLength={MAX_CHARS + 20}
              onChange={(e) => setQuote(e.target.value)}
            />
            <div className={`char-count ${countClass}`}>{charsLeft} characters left</div>
          </div>

          <div className="card">
            <label className="field-label">Visual style</label>
            <div className="style-grid">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  className={`style-chip ${style === s.id ? "selected" : ""}`}
                  onClick={() => setStyle(s.id)}
                >
                  <div className="name">{s.name}</div>
                  <div className="desc">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button className="generate-btn" onClick={handleGenerate} disabled={!quote.trim()}>
            Generate video
          </button>
          {errorMsg && <div className="error-box">{errorMsg}</div>}
        </>
      ) : null}

      {phase === "generating" && (
        <div className="card progress-wrap">
          <div className="progress-status">Rendering your video…</div>
          <div className="progress-bar"><div className="progress-bar-fill" /></div>
          <div className="progress-status">Status: {statusText}</div>
        </div>
      )}

      {phase === "done" && (
        <div className="card">
          <div className="video-frame">
            <video src={videoUrl} controls playsInline />
          </div>
          <div className="action-row">
            <a className="btn-secondary" href={videoUrl} download>Download</a>
            <button className="btn-primary" onClick={reset}>Create another</button>
          </div>
        </div>
      )}
    </div>
  );
}
