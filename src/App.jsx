import { useEffect, useRef, useState } from "react";

const API_URL =
  "https://j-tec-video-production-backend.onrender.com";

const STYLES = [
  {
    id: "cinematic",
    name: "Cinematic",
    icon: "🎬",
    description: "Epic & dramatic",
  },
  {
    id: "dark",
    name: "Dark",
    icon: "🌑",
    description: "Moody & mysterious",
  },
  {
    id: "soft",
    name: "Soft",
    icon: "☁️",
    description: "Peaceful & emotional",
  },
  {
    id: "colourful",
    name: "Colourful",
    icon: "🌈",
    description: "Bright & energetic",
  },
  {
    id: "powerful",
    name: "Powerful",
    icon: "⚡",
    description: "Strong & intense",
  },
];

function App() {
  const [quote, setQuote] = useState("");
  const [style, setStyle] = useState("cinematic");

  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);

  const [scene, setScene] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState("");

  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const startGeneration = async () => {
    setError("");
    setVideoUrl(null);
    setScene(null);
    setProgress(0);

    const cleanQuote = quote.trim();

    if (cleanQuote.length < 3) {
      setError("Please enter at least 3 characters.");
      return;
    }

    if (cleanQuote.length > 500) {
      setError("Your quote cannot exceed 500 characters.");
      return;
    }

    try {
      setStatus("starting");

      const response = await fetch(`${API_URL}/api/v1/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote: cleanQuote,
          style,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.job_id) {
        throw new Error("The server did not return a job ID.");
      }

      setJobId(data.job_id);
      setStatus(data.status || "queued");

      pollJob(data.job_id);
    } catch (err) {
      setStatus("failed");
      setError(
        "Could not start video generation. The server may be waking up. Please try again."
      );
    }
  };

  const pollJob = (id) => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/v1/videos/${id}`
        );

        if (!response.ok) {
          throw new Error("Unable to check video status.");
        }

        const data = await response.json();

        setStatus(data.status);
        setProgress(data.progress || 0);

        if (data.scene) {
          setScene(data.scene);
        }

        if (data.status === "completed") {
          clearInterval(pollRef.current);

          setVideoUrl(
            `${API_URL}/api/v1/videos/${id}/file`
          );
        }

        if (data.status === "failed") {
          clearInterval(pollRef.current);

          setError(
            data.error ||
              "Video generation failed."
          );
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkStatus();

    pollRef.current = setInterval(
      checkStatus,
      2000
    );
  };

  const resetGenerator = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    setQuote("");
    setJobId(null);
    setStatus("idle");
    setProgress(0);
    setScene(null);
    setVideoUrl(null);
    setError("");
  };

  const isGenerating =
    status !== "idle" &&
    status !== "completed" &&
    status !== "failed";

  const statusText = {
    starting: "Starting...",
    queued: "Waiting in queue...",
    analyzing: "Analyzing your quote...",
    finding_visual: "Finding the perfect visual...",
    scene_ready: "Preparing cinematic scene...",
    rendering: "Creating your video...",
    ready_for_render: "Preparing renderer...",
    completed: "Your video is ready!",
    failed: "Generation failed",
  };

  return (
    <div className="app">

      <header className="header">
        <div className="brand">
          <div className="brand-mark">
            JT
          </div>

          <div>
            <div className="brand-name">
              J TEC
            </div>

            <div className="brand-subtitle">
              VIDEO PRODUCTION
            </div>
          </div>
        </div>

        <div className="status-dot">
          <span></span>
          ONLINE
        </div>
      </header>

      <main className="container">

        <section className="hero">
          <div className="badge">
            ✦ AI CINEMATIC VIDEO CREATOR
          </div>

          <h1>
            Turn Your Words
            <br />
            Into <span>Cinematic Videos.</span>
          </h1>

          <p>
            Enter a motivational quote and J TEC
            will transform your words into a
            beautiful cinematic short.
          </p>
        </section>

        <section className="generator">

          <div className="card">

            <div className="card-header">
              <div>
                <h2>Your Motivation</h2>
                <p>
                  Write something worth remembering.
                </p>
              </div>

              <div className="counter">
                {quote.length}/500
              </div>
            </div>

            <textarea
              value={quote}
              onChange={(e) =>
                setQuote(e.target.value.slice(0, 500))
              }
              placeholder="Never give up. Your time is coming..."
              disabled={isGenerating}
            />

            <div className="quote-tip">
              💡 Short, powerful quotes usually
              look best on screen.
            </div>
          </div>

          <div className="card">

            <div className="card-header">
              <div>
                <h2>Choose Your Style</h2>
                <p>
                  Select the feeling of your video.
                </p>
              </div>
            </div>

            <div className="styles">

              {STYLES.map((item) => (
                <button
                  key={item.id}
                  className={`style ${
                    style === item.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setStyle(item.id)
                  }
                  disabled={isGenerating}
                >
                  <span className="style-icon">
                    {item.icon}
                  </span>

                  <span className="style-info">
                    <strong>
                      {item.name}
                    </strong>

                    <small>
                      {item.description}
                    </small>
                  </span>

                  <span className="check">
                    {style === item.id
                      ? "✓"
                      : ""}
                  </span>
                </button>
              ))}

            </div>
          </div>

          {error && (
            <div className="error">
              ⚠️ {error}
            </div>
          )}

          {isGenerating && (
            <div className="progress-card">

              <div className="progress-top">
                <span>
                  {statusText[status] ||
                    "Creating video..."}
                </span>

                <strong>
                  {progress}%
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-bar"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="job">
                Job: {jobId}
              </div>
            </div>
          )}

          {!videoUrl && (
            <button
              className="generate"
              onClick={startGeneration}
              disabled={
                isGenerating ||
                quote.trim().length < 3
              }
            >
              <span>✦</span>

              {isGenerating
                ? "Creating Your Video..."
                : "Generate Cinematic Video"}

              <span>→</span>
            </button>
          )}

          {videoUrl && (
            <section className="result">

              <div className="result-title">
                <span>✓</span>
                <div>
                  <h2>Your Video Is Ready</h2>
                  <p>
                    Created by J TEC Video Production
                  </p>
                </div>
              </div>

              <div className="video-wrapper">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>

              <div className="result-actions">

                <a
                  href={videoUrl}
                  download={`j-tec-${jobId}.mp4`}
                  className="download"
                >
                  ↓ Download Video
                </a>

                <button
                  className="another"
                  onClick={resetGenerator}
                >
                  + Create Another
                </button>

              </div>

            </section>
          )}

        </section>

        <section className="features">

          <div>
            <span>🎯</span>
            <strong>Smart Visuals</strong>
            <p>
              Matching visuals for your message.
            </p>
          </div>

          <div>
            <span>🎬</span>
            <strong>Cinematic Motion</strong>
            <p>
              Smooth camera movement and effects.
            </p>
          </div>

          <div>
            <span>📱</span>
            <strong>Social Ready</strong>
            <p>
              Vertical format for Shorts and Reels.
            </p>
          </div>

        </section>

      </main>

      <footer>
        © {new Date().getFullYear()} J TEC Video
        Production
      </footer>

    </div>
  );
}

export default App;
