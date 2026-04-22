import { useState, useEffect, useRef } from "react";


// ─── Chart.js via CDN ────────────────────────────────────────────────────────
const loadScript = (src) =>
  new Promise((res) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    document.head.appendChild(s);
  });

// ─── Groq API call ───────────────────────────────────────────────────────────
async function callGroq(messages, systemPrompt, apiKey) {
  if (!apiKey) throw new Error("NO_KEY");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error("INVALID_KEY");
    throw new Error(err?.error?.message || "API_ERROR");
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Safe JSON parse ──────────────────────────────────────────────────────────
function safeParseJSON(text) {
  // Strip markdown fences
  let clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Extract first JSON object/array
  const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) clean = match[0];
  return JSON.parse(clean);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const randBetween = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const CATS = ["Technology", "Sustainability", "Healthcare", "Education", "Finance", "Operations"];

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #030810;
    --surface: #070f1e;
    --panel:   #0a1628;
    --border:  #0d2244;
    --cyan:    #00e5ff;
    --orange:  #ff6b35;
    --purple:  #7b2fff;
    --green:   #00ff88;
    --red:     #ff3366;
    --yellow:  #ffd700;
    --text:    #c8d8f0;
    --dim:     #4a6080;
    --glow:    rgba(0,229,255,0.15);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Rajdhani', sans-serif; overflow: hidden; }

  .app { display: flex; height: 100vh; width: 100vw; background: var(--bg); position: relative; overflow: hidden; }

  .app::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridScroll 30s linear infinite;
  }
  @keyframes gridScroll { from { background-position: 0 0; } to { background-position: 40px 40px; } }

  .app::after {
    content: '';
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 72px; min-height: 100vh; background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center;
    padding: 16px 0; gap: 6px; z-index: 10; position: relative;
  }

  .logo-mark {
    width: 42px; height: 42px; border-radius: 10px;
    background: linear-gradient(135deg, var(--cyan), var(--purple));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Orbitron', monospace; font-weight: 900; font-size: 14px; color: #000;
    box-shadow: 0 0 20px rgba(0,229,255,0.5);
    margin-bottom: 12px;
  }

  .nav-btn {
    width: 48px; height: 48px; border-radius: 12px; border: none;
    background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 2px;
    color: var(--dim); transition: all 0.2s; position: relative;
    font-size: 18px;
  }
  .nav-btn:hover { background: var(--glow); color: var(--cyan); }
  .nav-btn.active { background: rgba(0,229,255,0.12); color: var(--cyan); }
  .nav-btn.active::before {
    content: ''; position: absolute; left: -1px; top: 50%; transform: translateY(-50%);
    width: 3px; height: 28px; background: var(--cyan); border-radius: 0 3px 3px 0;
    box-shadow: 0 0 8px var(--cyan);
  }
  .nav-label { font-size: 7px; font-family: 'JetBrains Mono'; letter-spacing: 0.5px; text-transform: uppercase; }

  /* ── Main layout ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; z-index: 5; }

  /* ── Topbar ── */
  .topbar {
    height: 56px; background: var(--surface); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0;
  }
  .topbar-title { font-family: 'Orbitron', monospace; font-size: 15px; color: var(--cyan); font-weight: 700; letter-spacing: 2px; }
  .topbar-sub { font-size: 11px; color: var(--dim); font-family: 'JetBrains Mono'; margin-left: 4px; }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }

  .status-pill {
    padding: 4px 10px; border-radius: 20px; font-size: 10px; font-family: 'JetBrains Mono';
    letter-spacing: 1px; border: 1px solid; display: flex; align-items: center; gap: 5px;
  }
  .status-pill.online { border-color: var(--green); color: var(--green); }
  .status-pill.offline { border-color: var(--red); color: var(--red); }
  .status-pill .dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: blink 1.5s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--purple), var(--cyan));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Orbitron'; font-size: 11px; font-weight: 700; color: #fff;
    cursor: pointer; transition: box-shadow 0.2s;
  }
  .avatar:hover { box-shadow: 0 0 12px rgba(0,229,255,0.4); }

  /* ── Content area ── */
  .content { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .content::-webkit-scrollbar { width: 4px; }
  .content::-webkit-scrollbar-track { background: var(--bg); }
  .content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* ── Cards / Panels ── */
  .card {
    background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; position: relative; overflow: hidden; margin-bottom: 16px;
  }
  .card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    opacity: 0.4;
  }

  .card-title {
    font-family: 'Orbitron', monospace; font-size: 11px; color: var(--cyan);
    letter-spacing: 2px; text-transform: uppercase; font-weight: 600;
    margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }
  .card-title .icon { font-size: 14px; }

  /* ── Grid layouts ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

  /* ── Stat cards ── */
  .stat-card {
    background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
    padding: 16px; position: relative; overflow: hidden;
  }
  .stat-value { font-family: 'Orbitron', monospace; font-size: 28px; font-weight: 700; color: var(--cyan); }
  .stat-label { font-size: 11px; color: var(--dim); margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
  .stat-delta { font-size: 10px; font-family: 'JetBrains Mono'; margin-top: 4px; }
  .stat-delta.up { color: var(--green); }
  .stat-delta.down { color: var(--red); }

  /* ── Form elements ── */
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .form-label { font-size: 11px; color: var(--dim); font-family: 'JetBrains Mono'; letter-spacing: 1px; text-transform: uppercase; }
  .form-input, .form-textarea, .form-select {
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); font-family: 'Rajdhani', sans-serif; font-size: 14px;
    padding: 10px 14px; transition: border-color 0.2s, box-shadow 0.2s; outline: none; width: 100%;
  }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(0,229,255,0.08);
  }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-select option { background: var(--panel); }
  .form-input-wrap { position: relative; }
  .form-input-wrap .form-input { padding-right: 90px; }
  .form-input-action {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    background: rgba(0,229,255,0.12); border: 1px solid var(--cyan); border-radius: 6px;
    color: var(--cyan); font-size: 10px; font-family: 'JetBrains Mono'; padding: 3px 10px;
    cursor: pointer; letter-spacing: 0.5px;
  }
  .form-input-action:hover { background: rgba(0,229,255,0.2); }

  /* ── Buttons ── */
  .btn {
    border: none; border-radius: 8px; font-family: 'Rajdhani', sans-serif;
    font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    cursor: pointer; padding: 10px 20px; transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--cyan), #0090a8);
    color: #000; box-shadow: 0 0 20px rgba(0,229,255,0.25);
  }
  .btn-primary:hover { box-shadow: 0 0 30px rgba(0,229,255,0.5); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-ghost:hover { border-color: var(--cyan); color: var(--cyan); }
  .btn-danger { background: rgba(255,51,102,0.15); border: 1px solid var(--red); color: var(--red); }
  .btn-purple { background: rgba(123,47,255,0.2); border: 1px solid var(--purple); color: var(--purple); }
  .btn-orange { background: rgba(255,107,53,0.15); border: 1px solid var(--orange); color: var(--orange); }
  .btn-yellow { background: rgba(255,215,0,0.1); border: 1px solid var(--yellow); color: var(--yellow); }

  /* ── Score badge ── */
  .score-ring {
    width: 64px; height: 64px; border-radius: 50%; border: 3px solid;
    display: flex; align-items: center; justify-content: center; flex-direction: column;
    flex-shrink: 0;
  }
  .score-ring .score-num { font-family: 'Orbitron', monospace; font-size: 18px; font-weight: 700; }
  .score-ring .score-lbl { font-size: 8px; letter-spacing: 0.5px; }
  .score-high { border-color: var(--green); color: var(--green); }
  .score-mid { border-color: var(--orange); color: var(--orange); }
  .score-low { border-color: var(--red); color: var(--red); }

  /* ── Idea card ── */
  .idea-item {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 16px; display: flex; gap: 14px; align-items: flex-start;
    margin-bottom: 10px; transition: border-color 0.2s, box-shadow 0.2s; cursor: pointer;
  }
  .idea-item:hover { border-color: var(--cyan); box-shadow: 0 0 16px rgba(0,229,255,0.06); }
  .idea-item.selected { border-color: var(--cyan); box-shadow: 0 0 0 1px var(--cyan) inset; }
  .idea-body { flex: 1; min-width: 0; }
  .idea-title { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 4px; }
  .idea-desc { font-size: 12px; color: var(--dim); line-height: 1.5; }
  .idea-meta { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }

  .tag {
    padding: 2px 8px; border-radius: 4px; font-size: 10px; font-family: 'JetBrains Mono';
    border: 1px solid; letter-spacing: 0.5px;
  }
  .tag-cat { border-color: var(--purple); color: var(--purple); background: rgba(123,47,255,0.08); }
  .tag-id { border-color: var(--dim); color: var(--dim); }

  /* ── AI Analysis panel ── */
  .metrics-row { display: flex; gap: 12px; margin-bottom: 14px; }
  .metric-bar { flex: 1; margin-bottom: 10px; }
  .metric-top { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
  .metric-top .metric-name { color: var(--dim); font-family: 'JetBrains Mono'; }
  .metric-top .metric-val { color: var(--cyan); font-family: 'Orbitron'; font-size: 11px; }
  .bar-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; transition: width 0.8s ease; }

  /* ── Debate ── */
  .agent-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 14px; margin-bottom: 10px;
  }
  .agent-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .agent-icon {
    width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center;
    justify-content: center; font-size: 14px; flex-shrink: 0;
  }
  .agent-name { font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 600; }
  .agent-role { font-size: 10px; color: var(--dim); }
  .agent-text { font-size: 13px; line-height: 1.6; color: var(--text); }

  /* ── Loader ── */
  .loader { display: flex; align-items: center; gap: 8px; color: var(--dim); font-family: 'JetBrains Mono'; font-size: 12px; padding: 8px 0; }
  .spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--cyan); border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Leaderboard ── */
  .lb-row { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; margin-bottom: 6px; background: var(--surface); border: 1px solid var(--border); }
  .lb-rank { font-family: 'Orbitron', monospace; font-size: 18px; font-weight: 700; width: 32px; text-align: center; }
  .lb-rank.gold { color: #ffd700; }
  .lb-rank.silver { color: #c0c0c0; }
  .lb-rank.bronze { color: #cd7f32; }
  .lb-info { flex: 1; min-width: 0; }
  .lb-name { font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lb-cat { font-size: 11px; color: var(--dim); }
  .lb-score { font-family: 'Orbitron', monospace; font-size: 20px; color: var(--cyan); }

  /* ── Votes ── */
  .vote-btn { background: none; border: 1px solid var(--border); border-radius: 6px; color: var(--dim); cursor: pointer; padding: 4px 10px; font-size: 12px; transition: all 0.2s; }
  .vote-btn:hover { border-color: var(--green); color: var(--green); }
  .vote-btn.voted { border-color: var(--green); color: var(--green); background: rgba(0,255,136,0.08); }

  /* ── Voice badge ── */
  .voice-wave { display: flex; align-items: center; gap: 3px; }
  .voice-bar { width: 3px; border-radius: 2px; background: var(--cyan); animation: wave 1.2s ease-in-out infinite; }
  .voice-bar:nth-child(2) { animation-delay: 0.2s; }
  .voice-bar:nth-child(3) { animation-delay: 0.4s; }
  .voice-bar:nth-child(4) { animation-delay: 0.6s; }
  @keyframes wave { 0%,100%{height:4px} 50%{height:14px} }

  /* ── Auth screen ── */
  .auth-screen {
    width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg); position: fixed; inset: 0; z-index: 100;
    background-image: radial-gradient(ellipse at 30% 50%, rgba(0,229,255,0.04) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(123,47,255,0.04) 0%, transparent 50%);
  }
  .auth-box {
    width: 440px; background: var(--panel); border: 1px solid var(--border); border-radius: 16px;
    padding: 36px; position: relative; overflow: hidden;
  }
  .auth-box::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--cyan), var(--purple));
  }
  .auth-logo { text-align: center; margin-bottom: 28px; }
  .auth-logo-text { font-family: 'Orbitron', monospace; font-size: 24px; font-weight: 900; color: var(--cyan); letter-spacing: 4px; }
  .auth-logo-sub { font-size: 11px; color: var(--dim); letter-spacing: 2px; margin-top: 4px; }
  .auth-title { font-family: 'Orbitron', monospace; font-size: 14px; color: #fff; margin-bottom: 20px; }

  /* ── API key banner ── */
  .api-banner {
    background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.3);
    border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;
    font-size: 12px; color: var(--yellow); font-family: 'JetBrains Mono';
    display: flex; align-items: flex-start; gap: 10px;
  }
  .api-banner-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .api-banner a { color: var(--cyan); }

  /* ── Key indicator in topbar ── */
  .key-pill {
    padding: 4px 10px; border-radius: 20px; font-size: 10px; font-family: 'JetBrains Mono';
    letter-spacing: 1px; border: 1px solid; display: flex; align-items: center; gap: 5px;
    cursor: pointer; transition: all 0.2s;
  }
  .key-pill.set { border-color: var(--green); color: var(--green); }
  .key-pill.unset { border-color: var(--yellow); color: var(--yellow); }
  .key-pill:hover { opacity: 0.8; }

  /* ── Modal overlay ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
  }
  .modal-box {
    width: 460px; background: var(--panel); border: 1px solid var(--border); border-radius: 16px;
    padding: 32px; position: relative;
  }
  .modal-box::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--yellow), var(--cyan));
  }
  .modal-title { font-family: 'Orbitron', monospace; font-size: 13px; color: var(--cyan); margin-bottom: 20px; letter-spacing: 2px; }
  .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--dim); font-size: 18px; cursor: pointer; }
  .modal-close:hover { color: var(--text); }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 200;
    padding: 12px 20px; border-radius: 10px; font-size: 13px;
    background: var(--panel); border: 1px solid var(--cyan); color: var(--cyan);
    box-shadow: 0 0 20px rgba(0,229,255,0.2); animation: slideUp 0.3s ease;
    font-family: 'JetBrains Mono'; max-width: 340px;
  }
  .toast.error { border-color: var(--red); color: var(--red); box-shadow: 0 0 20px rgba(255,51,102,0.2); }
  .toast.warn { border-color: var(--yellow); color: var(--yellow); box-shadow: 0 0 20px rgba(255,215,0,0.2); }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  /* ── Voice speaking indicator ── */
  .speaking-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(0,229,255,0.08); border: 1px solid var(--cyan);
    font-size: 10px; font-family: 'JetBrains Mono'; color: var(--cyan);
  }

  /* ── Chart container ── */
  .chart-wrap { position: relative; width: 100%; }
  canvas { max-width: 100%; }

  /* ── Section header ── */
  .section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .section-hdr-title { font-family: 'Orbitron', monospace; font-size: 13px; color: var(--cyan); letter-spacing: 2px; }

  .empty-state { text-align: center; padding: 40px 20px; color: var(--dim); font-family: 'JetBrains Mono'; font-size: 12px; }
  .empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.4; }

  .divider { height: 1px; background: var(--border); margin: 16px 0; }

  .ppt-preview { background: var(--surface); border-radius: 10px; padding: 20px; border: 1px solid var(--border); }
  .ppt-slide { background: #0d1b2e; border-radius: 8px; padding: 20px; margin-bottom: 10px; border: 1px solid rgba(0,229,255,0.1); }
  .ppt-slide-num { font-size: 9px; font-family: 'JetBrains Mono'; color: var(--dim); margin-bottom: 6px; }
  .ppt-slide-title { font-family: 'Orbitron', monospace; font-size: 14px; color: var(--cyan); margin-bottom: 8px; }
  .ppt-slide-body { font-size: 12px; color: var(--text); line-height: 1.7; }

  /* ── Groq badge ── */
  .groq-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 8px; border-radius: 4px;
    background: rgba(123,47,255,0.12); border: 1px solid rgba(123,47,255,0.4);
    font-size: 9px; font-family: 'JetBrains Mono'; color: var(--purple); letter-spacing: 1px;
  }
  .groq-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--purple); animation: blink 1.5s infinite; }
`;

// ─── Inject CSS ───────────────────────────────────────────────────────────────
if (!document.getElementById("innomind-styles")) {
  const s = document.createElement("style");
  s.id = "innomind-styles";
  s.textContent = CSS;
  document.head.appendChild(s);
}

function scoreClass(n) {
  if (n >= 75) return "score-high";
  if (n >= 50) return "score-mid";
  return "score-low";
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function InnoMindAI() {


  // ── Auth ──
  const [authed, setAuthed] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [user, setUser] = useState(null);

  // ── Groq API Key ──
  const [groqKey, setGroqKey] = useState("");
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const keyIsSet = groqKey.startsWith("gsk_") && groqKey.length > 20;

  // ── Nav ──
  const [view, setView] = useState("dashboard");

  // ── Ideas ──
  const [ideas, setIdeas] = useState([
    {
      id: "IDX001", title: "Smart Grid Energy Optimizer", category: "Sustainability",
      desc: "AI system to balance energy loads across city grids using real-time demand prediction.",
      score: 87, feasibility: 82, risk: 28, votes: 14, voted: false,
      suggestions: "Strong ROI potential. Consider partnering with utility companies early.",
      analyzed: true,
    },
    {
      id: "IDX002", title: "Healthcare AI Triage Bot", category: "Healthcare",
      desc: "Chatbot that pre-screens patients and routes them to appropriate care levels.",
      score: 79, feasibility: 74, risk: 35, votes: 9, voted: false,
      suggestions: "Requires HIPAA compliance layer. Pilot in one hospital first.",
      analyzed: true,
    },
  ]);
  const [selIdea, setSelIdea] = useState(null);
useEffect(() => {
  const saved = localStorage.getItem("innomind_ideas");
  if (saved) setIdeas(JSON.parse(saved));
}, []);

useEffect(() => {
  localStorage.setItem("innomind_ideas", JSON.stringify(ideas));
}, [ideas]);  

useEffect(() => {
  localStorage.setItem("innomind_ideas", JSON.stringify(ideas));
}, [ideas]);

  // ── Submit form ──
  const [form, setForm] = useState({ title: "", category: CATS[0], desc: "" });
  const [submitting, setSubmitting] = useState(false);

  // ── Debate ──
  const [debate, setDebate] = useState(null);
  const [debating, setDebating] = useState(false);

  // ── PPT ──
  const [ppt, setPpt] = useState(null);
  const [genPpt, setGenPpt] = useState(false);

async function autocompleteIdea(text) {
  if (!groqKey || text.length < 10) return;

  try {
    const res = await callGroq(
      [{ role: "user", content: `Complete this startup idea:\n${text}` }],
      "Complete the idea in one short sentence.",
      groqKey
    );

    setForm((prev) => ({
      ...prev,
      desc: prev.desc + " " + res,
    }));
  } catch {}
}

  // ── Voice ──
  const [speaking, setSpeaking] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("info");

  // ── Charts ──
  const catChartRef = useRef(null);
  const scoreChartRef = useRef(null);
  const catChartInst = useRef(null);
  const scoreChartInst = useRef(null);

  const showToast = (msg, type = "info") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Guard: require key before AI calls ──
  function requireKey() {
    if (!keyIsSet) {
      setShowKeyModal(true);
      showToast("⚠ Add your Groq API key first", "warn");
      return false;
    }
    return true;
  }

  // ── Charts ──
  useEffect(() => {
    if (view !== "dashboard") return;
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js").then(() => {
      renderCharts();
    });
  }, [view, ideas]);

  function renderCharts() {
    const Chart = window.Chart;
    if (!Chart) return;
    if (catChartRef.current) {
      const catCounts = {};
      CATS.forEach((c) => (catCounts[c] = 0));
      ideas.forEach((i) => (catCounts[i.category] = (catCounts[i.category] || 0) + 1));
      if (catChartInst.current) catChartInst.current.destroy();
      catChartInst.current = new Chart(catChartRef.current, {
        type: "doughnut",
        data: {
          labels: Object.keys(catCounts),
          datasets: [{
            data: Object.values(catCounts),
            backgroundColor: ["#00e5ff","#7b2fff","#ff6b35","#00ff88","#ff3366","#ffd700"],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#4a6080", font: { family: "Rajdhani", size: 11 }, boxWidth: 12 } },
          },
        },
      });
    }
    if (scoreChartRef.current) {
      const sorted = [...ideas].sort((a, b) => b.score - a.score);
      if (scoreChartInst.current) scoreChartInst.current.destroy();
      scoreChartInst.current = new Chart(scoreChartRef.current, {
        type: "bar",
        data: {
          labels: sorted.map((i) => i.title.length > 18 ? i.title.slice(0, 18) + "…" : i.title),
          datasets: [{
            label: "Innovation Score",
            data: sorted.map((i) => i.score),
            backgroundColor: sorted.map((i) =>
              i.score >= 75 ? "rgba(0,255,136,0.6)" : i.score >= 50 ? "rgba(255,107,53,0.6)" : "rgba(255,51,102,0.6)"
            ),
            borderColor: sorted.map((i) =>
              i.score >= 75 ? "#00ff88" : i.score >= 50 ? "#ff6b35" : "#ff3366"
            ),
            borderWidth: 1, borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#4a6080", font: { family: "Rajdhani", size: 10 } }, grid: { color: "#0d2244" } },
            y: { min: 0, max: 100, ticks: { color: "#4a6080", font: { family: "Rajdhani" } }, grid: { color: "#0d2244" } },
          },
        },
      });
    }
  }

  // ── Submit idea + Groq evaluate ──
  async function submitIdea() {
    if (!form.title.trim() || !form.desc.trim()) { showToast("⚠ Fill title and description", "warn"); return; }
    if (!requireKey()) return;
    setSubmitting(true);
    const id = "IDX" + uid();
    const newIdea = { id, ...form, score: 0, feasibility: 0, risk: 0, votes: 0, voted: false, analyzed: false, suggestions: "" };
    try {
      const res = await callGroq(
        [{ role: "user", content: `Evaluate this innovation idea:\nTitle: ${form.title}\nCategory: ${form.category}\nDescription: ${form.desc}\n\nRespond ONLY with a JSON object, no markdown, no explanation:\n{"score":85,"feasibility":78,"risk":32,"suggestions":"Your concise suggestion here"}` }],
        "You are an expert innovation evaluator. Respond ONLY with a raw JSON object. No markdown, no code fences, no explanation.",
        groqKey
      );
      let parsed;
      try { parsed = safeParseJSON(res); }
      catch { parsed = {}; }
      newIdea.score = Number(parsed.score) || randBetween(55, 90);
      newIdea.feasibility = Number(parsed.feasibility) || randBetween(50, 85);
      newIdea.risk = Number(parsed.risk) || randBetween(15, 45);
      newIdea.suggestions = parsed.suggestions || "Promising idea. Define your target market clearly.";
      newIdea.analyzed = true;
    } catch (err) {
      if (err.message === "INVALID_KEY") { showToast("✕ Invalid Groq API key — check and try again", "error"); setSubmitting(false); return; }
      newIdea.score = randBetween(55, 90);
      newIdea.feasibility = randBetween(50, 85);
      newIdea.risk = randBetween(15, 45);
      newIdea.suggestions = "Promising idea — AI evaluation used fallback scores.";
      newIdea.analyzed = true;
      showToast("⚠ AI call failed — fallback scores used", "warn");
    }
    setIdeas((prev) => [newIdea, ...prev]);
    setForm({ title: "", category: CATS[0], desc: "" });
    setSubmitting(false);
    setView("ideas");
    showToast("✓ Idea submitted & analyzed by Groq");
  }

  // ── Multi-agent debate ──
  async function runDebate(idea) {
    if (!requireKey()) return;
    setDebating(true);
    setDebate(null);
    setView("debate");
    try {
      const prompt = `Idea: "${idea.title}" — ${idea.desc}\nInnovation Score: ${idea.score}/100\n\nProvide a multi-agent debate with three distinct expert perspectives. Respond ONLY with a raw JSON object:\n{"investor":"2-3 sentences on ROI and market opportunity","engineer":"2-3 sentences on technical feasibility and build complexity","marketing":"2-3 sentences on positioning and go-to-market","verdict":"1-2 sentence final recommendation"}`;

      const res = await callGroq(
        [{ role: "user", content: prompt }],
        "You are a debate moderator simulating three expert AI agents: an Investor (ROI focus), an Engineer (technical focus), and a Marketing expert (GTM focus). Each gives a distinct perspective. End with a brief verdict. Respond ONLY with a raw JSON object, no markdown.",
        groqKey
      );
      let parsed;
      try { parsed = safeParseJSON(res); }
      catch { parsed = null; }
      if (parsed && parsed.investor && parsed.engineer && parsed.marketing && parsed.verdict) {
        setDebate(parsed);
      } else {
        setDebate({
          investor: "Strong ROI potential — target market is underserved and defensible.",
          engineer: "Technically feasible with existing stack. API latency needs monitoring.",
          marketing: "Compelling narrative for early adopters. Clear value proposition needed.",
          verdict: "Proceed to prototype — high potential with manageable risks.",
        });
        showToast("⚠ AI returned unexpected format — using fallback", "warn");
      }
    } catch (err) {
      if (err.message === "INVALID_KEY") { showToast("✕ Invalid Groq API key", "error"); setDebating(false); return; }
      setDebate({
        investor: "Solid investment thesis with clear monetization path.",
        engineer: "Build is achievable within 3 months with a small team.",
        marketing: "Clear value proposition — needs a compelling launch narrative.",
        verdict: "Green light — proceed with prototype phase.",
      });
      showToast("⚠ AI unavailable — fallback analysis used", "warn");
    }
    setDebating(false);
  }

  // ── Generate pitch deck ──
  async function generatePPT(idea) {
    if (!requireKey()) return;
    setGenPpt(true);
    setPpt(null);
    setView("pitch");
    try {
      const res = await callGroq(
        [{ role: "user", content: `Create a 5-slide investor pitch for:\nTitle: "${idea.title}"\nDescription: ${idea.desc}\nScore: ${idea.score}/100\nCategory: ${idea.category}\n\nRespond ONLY with a raw JSON object:\n{"slides":[{"num":"01","title":"Problem","body":"..."},{"num":"02","title":"Solution","body":"..."},{"num":"03","title":"Market","body":"..."},{"num":"04","title":"Traction","body":"..."},{"num":"05","title":"Ask","body":"..."}]}` }],
        "You are a startup pitch deck expert. Create punchy, investor-ready slide content. Keep each slide body to 2-3 impactful sentences. Respond ONLY with a raw JSON object, no markdown.",
        groqKey
      );
      let parsed;
      try { parsed = safeParseJSON(res); }
      catch { parsed = null; }
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length >= 3) {
        setPpt(parsed);
      } else {
        setPpt(fallbackPPT(idea));
        showToast("⚠ AI returned unexpected format — fallback pitch used", "warn");
      }
    } catch (err) {
      if (err.message === "INVALID_KEY") { showToast("✕ Invalid Groq API key", "error"); setGenPpt(false); return; }
      setPpt(fallbackPPT(idea));
      showToast("⚠ AI unavailable — fallback pitch used", "warn");
    }
    setGenPpt(false);
  }
// ===== AI AUTOCOMPLETE =====
async function autocompleteIdea(text) {
  if (!groqKey || text.length < 10) return;

  try {
    const res = await callGroq(
      [{ role: "user", content: `Complete this startup idea:\n${text}` }],
      "Complete the idea in one short sentence.",
      groqKey
    );

    setForm((prev) => ({
      ...prev,
      desc: prev.desc + " " + res,
    }));
  } catch {}
}
  function fallbackPPT(idea) {
    return {
      slides: [
        { num: "01", title: "The Problem", body: "Organizations struggle with efficiently evaluating and prioritizing innovation ideas at scale." },
        { num: "02", title: "Our Solution", body: `${idea.title} — ${idea.desc}` },
        { num: "03", title: "Market Opportunity", body: "TAM: $12B. Growing at 18% YoY. First-mover advantage in AI-driven innovation management." },
        { num: "04", title: "Traction & Validation", body: `Scored ${idea.score}/100 on our AI innovation index. Category: ${idea.category}.` },
        { num: "05", title: "The Ask", body: "Seeking seed funding to accelerate development, expand the team, and acquire first enterprise customers." },
      ],
    };
  }

  // ── Voice ──
  function speakIdea(idea) {
    if (!window.speechSynthesis) { showToast("⚠ Voice not supported in this browser", "warn"); return; }
    window.speechSynthesis.cancel();
    const text = `Analyzing idea: ${idea.title}. This ${idea.category} innovation scored ${idea.score} out of 100. Feasibility is ${idea.feasibility} percent. Risk factor is ${idea.risk} percent. ${idea.suggestions}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9; utt.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => v.lang.startsWith("en"));
    if (en) utt.voice = en;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  function voteIdea(id) {
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, votes: i.voted ? i.votes - 1 : i.votes + 1, voted: !i.voted } : i));
  }

  function saveKey() {
    const trimmed = groqKeyInput.trim();
    if (!trimmed.startsWith("gsk_") || trimmed.length < 20) {
      showToast("✕ Invalid key format — Groq keys start with gsk_", "error");
      return;
    }
    setGroqKey(trimmed);
    setGroqKeyInput("");
    setShowKeyModal(false);
    showToast("✓ Groq API key saved — AI features unlocked");
  }

  // ── API Key Modal ──
  const KeyModal = () => (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowKeyModal(false); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={() => setShowKeyModal(false)}>✕</button>
        <div className="modal-title">⚙ GROQ API KEY</div>
        <div className="api-banner">
          <div className="api-banner-icon">🔑</div>
          <div>
            Your key is stored only in this browser session — never sent anywhere except directly to Groq.
            Get a free key at <a href="https://console.groq.com" target="_blank" rel="noreferrer">console.groq.com</a>.
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Groq API Key</label>
          <input
            className="form-input"
            type="password"
            value={groqKeyInput}
            onChange={(e) => setGroqKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveKey()}
            placeholder="gsk_••••••••••••••••••••••"
            autoFocus
          />
        </div>
        {keyIsSet && (
          <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "JetBrains Mono", marginBottom: 12 }}>
            ✓ Key active — ends in …{groqKey.slice(-6)}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={saveKey} style={{ flex: 1, justifyContent: "center" }}>
            ✓ SAVE KEY
          </button>
          {keyIsSet && (
            <button className="btn btn-danger" onClick={() => { setGroqKey(""); setShowKeyModal(false); showToast("Key removed", "warn"); }}>
              REMOVE
            </button>
          )}
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: "var(--dim)", fontFamily: "JetBrains Mono", lineHeight: 1.6 }}>
          Model: llama-3.3-70b-versatile · Free tier available · ~1000 req/day
        </div>
      </div>
    </div>
  );

  // ── Auth screen ──
  if (!authed) {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          <div className="auth-logo">
            <div className="auth-logo-text">INNOMIND</div>
            <div className="auth-logo-sub">AI INNOVATION PLATFORM · POWERED BY GROQ</div>
          </div>
          <div className="auth-title">{authMode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</div>
          {authMode === "register" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@org.com" type="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              value={authPass}
              onChange={(e) => setAuthPass(e.target.value)}
              placeholder="••••••••"
              type="password"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (authEmail && authPass) {
                    setUser({ name: authName || authEmail.split("@")[0], email: authEmail });
                    setAuthed(true);
                  } else showToast("⚠ Fill all fields", "warn");
                }
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "JetBrains Mono", marginBottom: 14, padding: "8px 12px", background: "rgba(0,229,255,0.04)", borderRadius: 6, border: "1px solid rgba(0,229,255,0.1)" }}>
            ℹ Demo auth — in production, replace with JWT + backend
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            onClick={() => {
              if (authEmail && authPass) {
                setUser({ name: authName || authEmail.split("@")[0], email: authEmail });
                setAuthed(true);
              } else showToast("⚠ Fill all fields", "warn");
            }}>
            {authMode === "login" ? "▶ LAUNCH PLATFORM" : "✓ CREATE ACCOUNT"}
          </button>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--dim)" }}>
            {authMode === "login" ? "No account? " : "Have account? "}
            <span style={{ color: "var(--cyan)", cursor: "pointer" }} onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "Register" : "Sign in"}
            </span>
          </div>
        </div>
        {toast && <div className={`toast ${toastType}`}>{toast}</div>}
      </div>
    );
  }

  // ─── Nav items ────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", icon: "⬡", label: "HOME" },
    { id: "submit", icon: "✦", label: "NEW" },
    { id: "ideas", icon: "◈", label: "IDEAS" },
    { id: "debate", icon: "⚡", label: "DEBATE" },
    { id: "pitch", icon: "◩", label: "PITCH" },
    { id: "leaderboard", icon: "▲", label: "RANK" },
  ];

  const topIdea = ideas.length > 0 ? ideas.reduce((a, b) => (a.score > b.score ? a : b)) : null;
  const userInitials = user ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "??";

  // ─── Dashboard ────────────────────────────────────────────────────────────────
  const ViewDashboard = () => (
    <div>
      {!keyIsSet && (
        <div className="api-banner" style={{ cursor: "pointer" }} onClick={() => setShowKeyModal(true)}>
          <div className="api-banner-icon">⚡</div>
          <div>
            <strong>Connect Groq to unlock AI features</strong> — idea scoring, multi-agent debate, and pitch generation all require your free Groq API key.
            {" "}<span style={{ color: "var(--cyan)", textDecoration: "underline" }}>Add key →</span>
          </div>
        </div>
      )}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: "Total Ideas", value: ideas.length, delta: `+${ideas.length} this session`, up: true },
          { label: "Avg Score", value: ideas.length ? Math.round(ideas.reduce((a, b) => a + b.score, 0) / ideas.length) : 0, delta: "AI evaluated", up: true },
          { label: "Total Votes", value: ideas.reduce((a, b) => a + b.votes, 0), delta: "Collective input", up: true },
          { label: "Top Score", value: topIdea?.score || 0, delta: topIdea?.title?.slice(0, 20) || "—", up: true },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-delta ${s.up ? "up" : "down"}`}>{s.up ? "↑" : "↓"} {s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title"><span className="icon">◈</span> SCORE LEADERBOARD</div>
          <div className="chart-wrap" style={{ height: 200 }}>
            <canvas ref={scoreChartRef} />
          </div>
        </div>
        <div className="card">
          <div className="card-title"><span className="icon">⬡</span> CATEGORY DISTRIBUTION</div>
          <div className="chart-wrap" style={{ height: 200 }}>
            <canvas ref={catChartRef} />
          </div>
        </div>
      </div>

      {topIdea && (
        <div className="card">
          <div className="card-title"><span className="icon">✦</span> TOP IDEA OF SESSION</div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div className={`score-ring ${scoreClass(topIdea.score)}`}>
              <div className="score-num">{topIdea.score}</div>
              <div className="score-lbl">SCORE</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="idea-title">{topIdea.title}</div>
              <div className="idea-desc">{topIdea.desc}</div>
              <div className="idea-meta">
                <span className="tag tag-cat">{topIdea.category}</span>
                <span className="tag tag-id">#{topIdea.id}</span>
                <span className="tag" style={{ borderColor: "var(--green)", color: "var(--green)" }}>▲ {topIdea.votes} votes</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn btn-purple" onClick={() => runDebate(topIdea)} style={{ padding: "6px 14px", fontSize: 11 }}>⚡ DEBATE</button>
                <button className="btn btn-orange" onClick={() => generatePPT(topIdea)} style={{ padding: "6px 14px", fontSize: 11 }}>◩ PITCH</button>
                <button className="btn btn-ghost" onClick={() => speakIdea(topIdea)} style={{ padding: "6px 14px", fontSize: 11 }}>
                  {speaking ? (
                    <span className="speaking-badge">
                      <span className="voice-wave">{[1,2,3,4].map(i => <span key={i} className="voice-bar" style={{ height: 4 }} />)}</span>
                      SPEAKING
                    </span>
                  ) : "🔊 VOICE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Submit View ──────────────────────────────────────────────────────────────
  const ViewSubmit = () => (
  <div style={{ maxWidth: 600 }}>
    {!keyIsSet && (
      <div
        className="api-banner"
        style={{ cursor: "pointer", marginBottom: 16 }}
        onClick={() => setShowKeyModal(true)}
      >
        <div className="api-banner-icon">🔑</div>
        <div>
          AI evaluation requires a Groq key.{" "}
          <span style={{ color: "var(--cyan)", textDecoration: "underline" }}>
            Add it now →
          </span>
        </div>
      </div>
    )}

    <div className="card">
      <div className="card-title">
        <span className="icon">✦</span> SUBMIT NEW IDEA
        <span style={{ marginLeft: "auto" }}>
          <span className="groq-badge">
            <span className="groq-dot" />
            GROQ AI
          </span>
        </span>
      </div>

      {/* TITLE */}
      <div className="form-group">
        <label className="form-label">Idea Title</label>
        <input
          className="form-input"
          value={form.title}
          autoFocus
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="E.g. AI-powered supply chain optimizer"
        />
      </div>

      {/* CATEGORY */}
      <div className="form-group">
        <label className="form-label">Category</label>
        <select
          className="form-select"
          value={form.category}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, category: e.target.value }))
          }
        >
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* DESCRIPTION */}
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={form.desc}
         
 onChange={(e) => {
  const value = e.target.value;

  setForm((prev) => ({ ...prev, desc: value }));

  if (value.length % 30 === 0) {
    autocompleteIdea(value);
  }
}}
          placeholder="Describe your idea, the problem it solves, and target audience..."
          style={{ minHeight: 100 }}
        />
      </div>

      {/* BUTTON */}
      <button
        className="btn btn-primary"
        onClick={submitIdea}
        disabled={submitting}
        style={{ width: "100%", justifyContent: "center" }}
      >
        {submitting ? (
          <>
            <span className="spinner" /> ANALYZING WITH GROQ AI...
          </>
        ) : (
          "▶ SUBMIT & ANALYZE"
        )}
      </button>

      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "var(--dim)",
          fontFamily: "JetBrains Mono",
          textAlign: "center",
        }}
      >
        Groq AI will score innovation, feasibility, risk · Model:
        llama-3.3-70b-versatile
      </div>
    </div>
  </div>
);
  // ─── Ideas View ───────────────────────────────────────────────────────────────
  const ViewIdeas = () => (
    <div>
      <div className="section-hdr">
        <div className="section-hdr-title">ALL IDEAS ({ideas.length})</div>
        <button className="btn btn-primary" onClick={() => setView("submit")} style={{ padding: "6px 14px", fontSize: 11 }}>+ NEW IDEA</button>
      </div>
      {ideas.length === 0 && <div className="empty-state"><div className="empty-icon">◈</div>No ideas yet. Submit your first idea!</div>}
      {ideas.map((idea) => (
        <div key={idea.id} className={`idea-item ${selIdea?.id === idea.id ? "selected" : ""}`} onClick={() => setSelIdea(selIdea?.id === idea.id ? null : idea)}>
          <div className={`score-ring ${scoreClass(idea.score)}`}>
            <div className="score-num">{idea.score}</div>
            <div className="score-lbl">SCORE</div>
          </div>
          <div className="idea-body">
            <div className="idea-title">{idea.title}</div>
            <div className="idea-desc">{idea.desc}</div>
            <div className="idea-meta">
              <span className="tag tag-cat">{idea.category}</span>
              <span className="tag tag-id">#{idea.id}</span>
            </div>
            {selIdea?.id === idea.id && (
              <div style={{ marginTop: 14 }}>
                <div className="divider" />
                <div style={{ marginBottom: 12 }}>
                  {[
                    ["Innovation Score", idea.score, "var(--cyan)"],
                    ["Feasibility", idea.feasibility, "var(--green)"],
                    ["Risk Level", idea.risk, "var(--red)"],
                  ].map(([name, val, color]) => (
                    <div key={name} className="metric-bar">
                      <div className="metric-top">
                        <span className="metric-name">{name}</span>
                        <span className="metric-val" style={{ color }}>{val}%</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${val}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                {idea.suggestions && (
                  <div style={{ padding: "10px 14px", background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: 8, fontSize: 12, color: "var(--text)", marginBottom: 12 }}>
                    <span style={{ color: "var(--cyan)", fontFamily: "JetBrains Mono", fontSize: 10 }}>GROQ AI INSIGHT › </span>
                    {idea.suggestions}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className={`vote-btn${idea.voted ? " voted" : ""}`}
                    style={{ fontSize: 12 }}
                    onClick={(e) => { e.stopPropagation(); voteIdea(idea.id); }}>
                    ▲ {idea.votes} votes
                  </button>
                  <button className="btn btn-purple" onClick={(e) => { e.stopPropagation(); runDebate(idea); }} style={{ padding: "5px 12px", fontSize: 11 }}>⚡ DEBATE</button>
                  <button className="btn btn-orange" onClick={(e) => { e.stopPropagation(); generatePPT(idea); }} style={{ padding: "5px 12px", fontSize: 11 }}>◩ PITCH DECK</button>
                  <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); speakIdea(idea); }} style={{ padding: "5px 12px", fontSize: 11 }}>🔊 VOICE</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Debate View ──────────────────────────────────────────────────────────────
  const ViewDebate = () => (
    <div>
      <div className="section-hdr">
        <div className="section-hdr-title">⚡ MULTI-AGENT AI DEBATE</div>
        <span className="groq-badge"><span className="groq-dot" />GROQ · llama-3.3-70b</span>
      </div>
      {!debate && !debating && (
        <div className="card">
          <div className="card-title">SELECT IDEA TO DEBATE</div>
          {ideas.length === 0 && <div className="empty-state"><div className="empty-icon">⚡</div>Submit an idea first</div>}
          {ideas.map((idea) => (
            <div key={idea.id} className="idea-item" onClick={() => runDebate(idea)}>
              <div className={`score-ring ${scoreClass(idea.score)}`} style={{ width: 44, height: 44 }}>
                <div style={{ fontFamily: "Orbitron", fontSize: 13, fontWeight: 700 }}>{idea.score}</div>
              </div>
              <div className="idea-body">
                <div className="idea-title" style={{ fontSize: 13 }}>{idea.title}</div>
                <div className="idea-desc" style={{ fontSize: 11 }}>{idea.category}</div>
              </div>
              <button className="btn btn-purple" style={{ padding: "6px 12px", fontSize: 11 }}>⚡ DEBATE</button>
            </div>
          ))}
        </div>
      )}
      {debating && (
        <div className="card">
          <div className="loader"><span className="spinner" /> Running multi-agent debate via Groq AI...</div>
        </div>
      )}
      {debate && (
        <div>
          {[
            { role: "INVESTOR", icon: "💰", color: "var(--green)", bg: "rgba(0,255,136,0.08)", key: "investor" },
            { role: "ENGINEER", icon: "⚙️", color: "var(--cyan)", bg: "rgba(0,229,255,0.08)", key: "engineer" },
            { role: "MARKETING", icon: "📡", color: "var(--orange)", bg: "rgba(255,107,53,0.08)", key: "marketing" },
          ].map((agent) => (
            <div className="agent-card" key={agent.key}>
              <div className="agent-header">
                <div className="agent-icon" style={{ background: agent.bg, border: `1px solid ${agent.color}` }}>{agent.icon}</div>
                <div>
                  <div className="agent-name" style={{ color: agent.color }}>{agent.role} PERSPECTIVE</div>
                  <div className="agent-role">Groq AI Agent Analysis</div>
                </div>
              </div>
              <div className="agent-text">{debate[agent.key]}</div>
            </div>
          ))}
          <div className="card" style={{ borderColor: "var(--cyan)" }}>
            <div className="card-title" style={{ color: "var(--cyan)" }}>🏁 FINAL VERDICT</div>
            <div style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>{debate.verdict}</div>
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 4 }} onClick={() => setDebate(null)}>← NEW DEBATE</button>
        </div>
      )}
    </div>
  );

  // ─── Pitch View ───────────────────────────────────────────────────────────────
  const ViewPitch = () => (
    <div>
      <div className="section-hdr">
        <div className="section-hdr-title">◩ AUTO PITCH GENERATOR</div>
        <span className="groq-badge"><span className="groq-dot" />GROQ · llama-3.3-70b</span>
      </div>
      {!ppt && !genPpt && (
        <div className="card">
          <div className="card-title">SELECT IDEA FOR PITCH DECK</div>
          {ideas.length === 0 && <div className="empty-state"><div className="empty-icon">◩</div>Submit an idea first</div>}
          {ideas.map((idea) => (
            <div key={idea.id} className="idea-item" onClick={() => generatePPT(idea)}>
              <div className={`score-ring ${scoreClass(idea.score)}`} style={{ width: 44, height: 44 }}>
                <div style={{ fontFamily: "Orbitron", fontSize: 13, fontWeight: 700 }}>{idea.score}</div>
              </div>
              <div className="idea-body">
                <div className="idea-title" style={{ fontSize: 13 }}>{idea.title}</div>
                <div className="idea-desc" style={{ fontSize: 11 }}>{idea.category}</div>
              </div>
              <button className="btn btn-orange" style={{ padding: "6px 12px", fontSize: 11 }}>◩ GENERATE</button>
            </div>
          ))}
        </div>
      )}
      {genPpt && (
        <div className="card">
          <div className="loader"><span className="spinner" /> Generating investor pitch deck via Groq AI...</div>
        </div>
      )}
      {ppt && (
        <div>
          <div className="ppt-preview">
            {ppt.slides?.map((slide) => (
              <div className="ppt-slide" key={slide.num}>
                <div className="ppt-slide-num">SLIDE {slide.num}</div>
                <div className="ppt-slide-title">{slide.title}</div>
                <div className="ppt-slide-body">{slide.body}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const text = ppt.slides?.map(s => `[${s.title}]\n${s.body}`).join("\n\n") || "";
                navigator.clipboard?.writeText(text);
                showToast("✓ Pitch copied to clipboard");
              }}>
              ⎘ COPY PITCH
            </button>
            <button className="btn btn-ghost" onClick={() => setPpt(null)}>← NEW PITCH</button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Leaderboard ──────────────────────────────────────────────────────────────
  const ViewLeaderboard = () => {
    const sorted = [...ideas].sort((a, b) => b.score - a.score);
    const rankColors = ["gold", "silver", "bronze"];
    const rankNums = ["1", "2", "3"];
    return (
      <div>
        <div className="section-hdr">
          <div className="section-hdr-title">▲ INNOVATION LEADERBOARD</div>
        </div>
        {sorted.length === 0 && <div className="empty-state"><div className="empty-icon">▲</div>Submit ideas to see rankings</div>}
        {sorted.map((idea, i) => (
          <div
            className="lb-row"
            key={idea.id}
            style={i < 3 ? { borderColor: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : "#cd7f32" } : {}}>
            <div className={`lb-rank ${rankColors[i] || ""}`}>{rankNums[i] || i + 1}</div>
            <div className="lb-info">
              <div className="lb-name">{idea.title}</div>
              <div className="lb-cat">
                <span className="tag tag-cat">{idea.category}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: "var(--dim)" }}>#{idea.id}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div className="lb-score">{idea.score}</div>
              <button className={`vote-btn${idea.voted ? " voted" : ""}`} onClick={() => voteIdea(idea.id)}>▲ {idea.votes}</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {showKeyModal && <KeyModal />}

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="logo-mark">IM</div>
        {navItems.map((n) => (
          <button key={n.id} className={`nav-btn ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)} title={n.id}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
        <div style={{ marginTop: "auto" }}>
          <button className="nav-btn" onClick={() => setAuthed(false)} title="logout">
            <span style={{ fontSize: 16 }}>⏻</span>
            <span className="nav-label">EXIT</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div>
            <span className="topbar-title">INNOMIND AI</span>
            <span className="topbar-sub">// INNOVATION COMMAND CENTER</span>
          </div>
          <div className="topbar-right">
            {speaking && (
              <div className="speaking-badge">
                <div className="voice-wave">
                  {[1,2,3,4].map(i => <div key={i} className="voice-bar" />)}
                </div>
                AI SPEAKING
              </div>
            )}
            <button
              className={`key-pill ${keyIsSet ? "set" : "unset"}`}
              onClick={() => setShowKeyModal(true)}
              title={keyIsSet ? "Groq key active" : "Add Groq API key"}>
              {keyIsSet ? "⚡ GROQ ACTIVE" : "🔑 ADD KEY"}
            </button>
            <div className={`status-pill ${keyIsSet ? "online" : "offline"}`}>
              <span className="dot" />{keyIsSet ? "AI ONLINE" : "AI OFFLINE"}
            </div>
            <div className="avatar" title={user?.email} onClick={() => showToast(`Signed in as ${user?.email}`)}>
              {userInitials}
            </div>
          </div>
        </header>

        <div className="content">
          {view === "dashboard" && <ViewDashboard />}
          {view === "submit" && <ViewSubmit />}
          {view === "ideas" && <ViewIdeas />}
          {view === "debate" && <ViewDebate />}
          {view === "pitch" && <ViewPitch />}
          {view === "leaderboard" && <ViewLeaderboard />}
        </div>
      </div>

      {toast && <div className={`toast ${toastType}`}>{toast}</div>}
    </div>
  );
}
