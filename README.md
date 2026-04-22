[README.md](https://github.com/user-attachments/files/26969594/README.md)
# 🧠 InnoMind AI — AI-Powered Innovation Management Platform

> *"Transforming raw ideas into structured, evaluated, and actionable opportunities using AI."*

![Platform](https://img.shields.io/badge/Platform-React-61DAFB?style=flat-square&logo=react)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA3-FF6B35?style=flat-square)
![Status](https://img.shields.io/badge/Status-Live%20Demo-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 📌 Overview

**InnoMind AI** is a full-stack Innovation Management Platform that helps organizations move from guesswork to data-driven decision-making. It evaluates ideas in real time using AI, facilitates multi-perspective debates through autonomous AI agents, and automatically generates investor-ready pitch decks.

Built for **national hackathon competition** — targeting organizations that struggle with biased, unstructured, and inefficient innovation pipelines.

---

## 🚨 Problem Statement

Organizations face three core innovation failures:

- **Scattered ideas** — No centralized system to collect and evaluate proposals
- **Human bias** — Decisions driven by seniority, not merit
- **Execution gap** — Good ideas die without structure or visibility

---

## ✅ Solution

InnoMind AI provides a modular, AI-driven platform that:

1. Centralizes idea collection across categories
2. Auto-scores each idea across innovation, feasibility, and risk dimensions
3. Simulates multi-agent debate from three expert perspectives
4. Generates investor-ready pitch decks on demand
5. Tracks engagement through voting and real-time analytics

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Login / Register UI with session management |
| 💡 **Idea Submission** | Submit ideas with title, category, and description |
| 🤖 **AI Evaluation Engine** | Scores innovation (0–100), feasibility, risk + AI suggestions |
| 🧠 **Multi-Agent Debate** | Investor · Engineer · Marketing agents debate each idea |
| 📊 **Analytics Dashboard** | Live bar chart + doughnut chart via Chart.js |
| 🗳️ **Voting System** | Community votes on ideas for collective ranking |
| 📄 **Auto Pitch Generator** | AI-generated 5-slide investor pitch deck |
| 🎤 **Voice Output** | Web Speech API reads out AI insights |
| 🏆 **Leaderboard** | Real-time ranking of ideas by score + votes |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                       │
│         React JSX · Chart.js · Web Speech API            │
│         Glassmorphism UI · Command Center Aesthetic       │
└─────────────────────────┬────────────────────────────────┘
                          │ REST API calls
┌─────────────────────────▼────────────────────────────────┐
│                      BACKEND LAYER                        │
│         Flask · Python · Flask-CORS · python-pptx        │
└─────────────────────────┬────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────────┐  ┌──────────┐
│   AI LAYER  │  │  DATABASE LAYER │  │  EXPORT  │
│  Groq API   │  │  SQLite         │  │  python- │
│  (LLaMA3)   │  │  Users · Ideas  │  │  pptx    │
│  Multi-Agent│  │  Scores · Votes │  │  PPT Gen │
└─────────────┘  └─────────────────┘  └──────────┘
```

**Data Flow:**
`User submits idea → Flask API → Groq AI (LLaMA3) → Scores stored in SQLite → Dashboard updates in real time`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (JSX), Chart.js, Web Speech API |
| Backend | Python, Flask, Flask-CORS |
| AI Engine | Groq API (LLaMA3) |
| Database | SQLite |
| PPT Export | python-pptx |
| Deployment | Render (backend) · Vercel (frontend) |

---

## 🚀 Getting Started

### Prerequisites

```bash
sudo apt update
sudo apt install python3 python3-pip git -y
pip install virtualenv
```

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/innomind-ai.git
cd innomind-ai
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors requests python-pptx
```

Add your Groq API key in `app.py`:

```python
GROQ_API_KEY = "your_groq_key_here"
```

Run the backend:

```bash
python app.py
```

Test: visit `http://127.0.0.1:5000/ideas` — if JSON appears, backend is live ✅

### 3. Frontend Setup

```bash
cd frontend
# Open index.html directly in browser
# OR serve via Live Server extension in VS Code
```

Update `script.js` with your backend URL:

```javascript
const API = "http://127.0.0.1:5000"; // local
// const API = "https://your-app.onrender.com"; // deployed
```

---

## 🌐 Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set start command: `python app.py`
4. Add environment variable: `GROQ_API_KEY=your_groq_key`
5. Copy the deployed URL

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Upload `frontend/` folder
3. Update `API` constant in `script.js` to your Render URL
4. Deploy

---

## 📁 Project Structure

```
innomind-ai/
├── backend/
│   ├── app.py              # Flask API — routes, AI calls, DB
│   ├── requirements.txt    # Python dependencies
│   └── innomind.db         # SQLite database (auto-created)
│
├── frontend/
│   ├── index.html          # Main HTML layout
│   ├── style.css           # Glassmorphism UI
│   ├── script.js           # Charts, voice, API calls
│   └── manifest.json       # PWA manifest
│
└── README.md
```

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ideas` | Fetch all ideas |
| `POST` | `/ideas` | Submit a new idea |
| `POST` | `/analyze` | Trigger AI evaluation |
| `POST` | `/debate` | Run multi-agent debate |
| `POST` | `/generate-ppt` | Generate pitch deck |
| `POST` | `/vote/:id` | Vote on an idea |

---

## 🧪 Demo Flow (Hackathon Presentation)

1. **Login** with any credentials
2. **Submit idea** — e.g., *"AI traffic optimization system"*
3. **Show AI score** — innovation, feasibility, risk + suggestions
4. **Run Debate** — Investor · Engineer · Marketing agents respond
5. **View Dashboard** — charts update in real time
6. **Generate Pitch Deck** — 5-slide investor-ready output
7. **Voice Output** — AI reads the analysis aloud

**Closing line:**
> *"This platform transforms innovation from guesswork into data-driven decision-making."*

---

## 🔮 Future Scope

- 🔗 **Enterprise Integrations** — Slack, Jira, Confluence
- 📈 **Predictive Analytics** — Trend forecasting for innovation verticals
- 🤝 **Collaboration Mode** — Team-based idea refinement
- 🌐 **Multi-tenant SaaS** — Organization-level isolation
- 📱 **Mobile App** — React Native port

---

## 💼 Business Model

**SaaS Subscription** targeting R&D teams, innovation labs, and corporate accelerators:

| Tier | Target | Price |
|---|---|---|
| Starter | Small teams (≤10) | Free |
| Growth | Mid-size companies | $49/month |
| Enterprise | Large orgs + integrations | Custom |

---

## 👤 Author

**K Subramanyam**
- 🎓 KLH University — Information Security
- 💼 Cloud4C Pvt Ltd — Cybersecurity Intern (Forcepoint DLP · SentinelOne EDR)
- 📧 2320090053@klh.edu.in

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

> Built with ⚡ for national hackathon competition · InnoMind AI · 2025
