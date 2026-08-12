<div align="center">

# FX AlphaLab

### AI-Powered Multi-Agent Forex Intelligence Platform

**Real-time market intelligence · Explainable AI signals · Risk-aware decision support · Interactive performance analytics**

<br/>

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-337AB7?style=for-the-badge&logo=xgboost&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6B35?style=for-the-badge&logo=chromadb&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_LLM-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![MLflow](https://img.shields.io/badge/MLflow-0194E2?style=for-the-badge&logo=mlflow&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

<br/>

*A five-month academic engineering project built by a six-member multidisciplinary team at* ***ESPRIT*** *in collaboration with* ***VALUE***.

</div>

---

> [!IMPORTANT]
> FX AlphaLab is a **research and decision-support platform**. It does not provide financial advice and does not execute autonomous real-money trading. All performance figures below are project-level technical validation results measured during the academic development phase.

---

## Table of Contents

| | |
|---|---|
| [Overview](#overview) · [The Problem](#the-problem) · [The Approach](#the-approach) | [Core Capabilities](#core-capabilities) · [System Architecture](#system-architecture) |
| [Multi-Agent Layer](#multi-agent-intelligence-layer) · [Data & AI Pipeline](#data-and-ai-pipeline) | [AlphaBot & RAG](#alphabot-and-rag) · [Backend](#backend-architecture) · [Frontend](#frontend-dashboard) |
| [Backtesting](#backtesting-and-performance-analytics) · [MLOps](#mlops-and-monitoring) | [Validation](#technical-validation) · [Results](#performance-results) · [Tech Stack](#technology-stack) |
| [Repository Structure](#repository-structure) · [Showcase](#platform-showcase) | [Getting Started](#getting-started) · [Team](#team) · [License](#license) |

---

## Overview

Financial markets do not wait. Within a single hour a trader is exposed to price dislocations, macroeconomic releases, central-bank decisions, and a continuous stream of news arriving from dozens of sources at once.

The hard part is no longer *accessing* information. It is **filtering it, contextualizing it, and acting on it fast enough to matter**.

FX AlphaLab was built around that constraint. It brings five layers of financial intelligence into a single explainable pipeline:

| Layer | What it contributes |
|---|---|
| **Technical** | Price behaviour, momentum, trend structure, volatility regimes |
| **Macroeconomic** | Yield curves, economic indicators, scheduled events, regime detection |
| **Sentiment** | Financial-news tone, article-level impact, market positioning |
| **AI Reasoning** | Multi-agent orchestration, conviction scoring, natural-language explanation |
| **Operations** | Real-time dashboards, monitoring, backtesting, MLOps |

Rather than trusting one model or one indicator, the platform lets **specialized agents analyze the market from independent perspectives**, then routes their outputs through a central orchestrator and a conviction gate before anything reaches the user. The result is a signal you can interrogate — not a black box.

---

## The Problem

Forex analysis demands simultaneous interpretation of price action, technical indicators, macroeconomic events, news sentiment, volatility, historical strategy performance, and — critically — **signals that frequently contradict each other**.

Conventional dashboards present these dimensions in isolation, leaving the analyst to reconcile them by hand.

<table>
<tr>
<td width="20%"><b>🧩 Fragmented information</b></td>
<td>Price, macro, sentiment and news are analyzed in separate tools with no shared context.</td>
</tr>
<tr>
<td><b>🧠 High cognitive load</b></td>
<td>Contradictory indicators must be weighed and resolved manually, under time pressure.</td>
</tr>
<tr>
<td><b>🔍 Limited explainability</b></td>
<td>A recommendation without a traceable analytical path is difficult to justify or audit.</td>
</tr>
<tr>
<td><b>⏱️ Slow reaction time</b></td>
<td>Market conditions shift faster than any manual review cycle.</td>
</tr>
<tr>
<td><b>⚙️ Operational complexity</b></td>
<td>Live feeds, model outputs, backend services and dashboards must stay synchronized.</td>
</tr>
</table>

---

## The Approach

A modular **multi-agent architecture**, where each agent owns one dimension of the market and no single component owns the final call.

```
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  TECHNICAL   │  │    MACRO     │  │  SENTIMENT   │  │     RAG      │
   │   ANALYSIS   │  │   ANALYSIS   │  │   ANALYSIS   │  │  KNOWLEDGE   │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          └─────────────────┴─────────┬───────┴─────────────────┘
                                      ▼
                        ┌─────────────────────────┐
                        │  CENTRAL ORCHESTRATOR   │  ← context memory
                        └────────────┬────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │  CONVICTION GATE        │  ← rejects weak /
                        │  + VALIDATION LAYER     │    contradictory output
                        └────────────┬────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │   EXPLAINABLE SIGNAL    │
                        └────────────┬────────────┘
                                     ▼
                     REST API  ──┬──  WebSocket (live push)
                                 ▼
                        INTERACTIVE DASHBOARD
```

The key design decision: **not every analytical output is treated as equally trustworthy.** The conviction gate exists specifically to suppress signals that agents disagree on.

---

## Core Capabilities

<table>
<tr><th align="left" width="25%">🤖 Multi-Agent Intelligence</th><th align="left" width="25%">📊 Market Data Processing</th><th align="left" width="25%">🎯 Decision Support</th><th align="left" width="25%">💻 Experience & Ops</th></tr>
<tr valign="top">
<td>
Technical agent<br/>
Macro agent<br/>
Sentiment agent<br/>
Central orchestration<br/>
Conviction gate<br/>
Signal correction & monitoring<br/>
Cross-agent context memory<br/>
Risk-aware validation
</td>
<td>
FX price ingestion<br/>
Macroeconomic ingestion<br/>
Financial-news processing<br/>
Sentiment extraction<br/>
Unified feature matrix<br/>
Real-time context updates<br/>
Change detection
</td>
<td>
Consolidated signals<br/>
Confidence & conviction scoring<br/>
Position & risk analysis<br/>
Full signal history<br/>
Strategy performance analytics<br/>
Backtesting engine<br/>
Trade & pair comparison<br/>
Explainable rationale
</td>
<td>
Responsive React dashboard<br/>
Live price ticker<br/>
Technical chart suite<br/>
Economic-event calendar<br/>
News feed<br/>
AlphaBot assistant<br/>
WebSocket live updates<br/>
Docker · MLflow · Prometheus
</td>
</tr>
</table>

---

## System Architecture

<div align="center">
  <img src="screenshots/architecture.jpg" alt="FX AlphaLab global system architecture" width="100%"/>
</div>

The platform is organized into six layers, each independently testable and independently deployable.

<details open>
<summary><b>1 · Data Layer</b></summary>

Market prices, macroeconomic series, sentiment data, financial news, unified analytical matrices, and generated context/signal files — stored as Parquet for columnar read performance.
</details>

<details>
<summary><b>2 · Intelligence Layer</b></summary>

The specialized agents (`technical_agent.py`, `macro_agent.py`, `sentiment_agent.py`, `conviction_gate.py`) coordinated through `orchestrator.py`, `runner.py`, and `context_store.py`.
</details>

<details>
<summary><b>3 · Post-Processing Layer</b></summary>

Conviction calculation, signal correction, monitoring, validation, and change detection — the guardrails between raw model output and a user-facing signal.
</details>

<details>
<summary><b>4 · Service Layer</b></summary>

FastAPI services exposing prices, news, charts, live context, economic events, backtests, signals, AlphaBot, and real-time WebSocket channels.
</details>

<details>
<summary><b>5 · Presentation Layer</b></summary>

Signal cards, live ticker, technical charts, performance metrics, risk visualizations, trade history, event calendar, news, and conversational AlphaBot interaction.
</details>

<details>
<summary><b>6 · MLOps Layer</b></summary>

Dedicated Dockerfiles per concern, MLflow experiment tracking, Prometheus metric collection, isolated training environments, and Compose-based orchestration.
</details>

---

## Multi-Agent Intelligence Layer

### 📈 Technical Agent

Analyzes price behaviour and market microstructure.

- Processes market-price data and identifies technical patterns
- Evaluates momentum and trend direction
- Generates pair-specific technical signals with a confidence score
- Surfaces through dedicated visualizations: price evolution, RSI, MACD, Bollinger Bands, volatility, correlation

### 🏛️ Macro Agent

Analyzes macroeconomic context — the layer that explains *why* the market is positioned as it is.

- Consumes macroeconomic datasets and evaluates leading indicators
- Processes scheduled economic events (FOMC, CPI, jobless claims, ECB decisions)
- Detects market regimes (risk-on / risk-off, bearish / bullish structure)
- Contributes yield-curve and volatility context to the final decision
- Backed by trained macroeconomic model artifacts and dedicated macro feeds

### 📰 Sentiment Agent

Processes financial news and market tone.

- Consumes sentiment datasets and evaluates market tone at article level
- Analyzes financial-news context and directional impact
- Contributes sentiment orientation with an explicit confidence weight
- Backed by a trained sentiment model and a dedicated sentiment dataset

### 🎛️ Central Orchestrator

The bridge between independent analysis and a unified decision. It coordinates agent execution, collects individual recommendations, resolves signal divergence, manages analytical context, and forwards aggregated output downstream.

### 🛡️ Conviction Gate

The final control layer — and arguably the most important one for trustworthiness.

| Function | Effect |
|---|---|
| Aggregate agent confidence | Produces a single conviction score |
| Check analytical consistency | Flags cross-agent contradiction |
| Apply conviction rules | Enforces minimum-agreement thresholds |
| Reject weak signals | Downgrades to `HOLD` rather than forcing a call |

When agents disagree, the system says so — visible in the dashboard as `CONFLICT` / `PARTIAL` / `FULL` agreement.

### 🧠 Context Memory

The context store preserves cross-agent state: recent market conditions, shared analytical context, and the persistence needed for consistent downstream processing.

---

## Data and AI Pipeline

| Dataset | Content |
|---|---|
| `market_full.parquet` | Historical FX price and technical feature data |
| `macro_hourly.parquet` | Hourly macroeconomic indicator series |
| `sentiment_dataset.parquet` | News-derived sentiment features |
| `unified_matrix.parquet` | **204k+ rows** of integrated market, macro and sentiment features spanning **2015–2025** |

The unified matrix is the single source of truth for training and backtesting — every agent trains against a consistent, time-aligned feature space.

---

## AlphaBot and RAG

AlphaBot is the conversational layer that makes signals interrogable in natural language: *"How does this news affect EURUSD?"* returns a grounded, context-aware explanation rather than a generic answer.

**Components**

```
Deployment/Backend/app/api/alphabot.py          →  conversational endpoint
Deployment/Backend/app/services/agent_service.py →  agent bridge
fx_alphalab/fx_alphalab/data_feed/news_rag.py    →  retrieval over news corpus
fx_alphalab/fx_alphalab/data_feed/news_feed.py   →  live news ingestion
fx_alphalab/fx_alphalab/memory/context_store.py  →  conversation & market context
```

**Flow**

```
User question → context retrieval (signal + market state)
             → news retrieval (ChromaDB / sentence-transformers, keyword fallback)
             → LLM reasoning (Groq / Ollama)
             → grounded, cited explanation
```

RAG degrades gracefully: if the vector stack is unavailable, retrieval falls back to keyword scoring rather than failing.

---

## Backend Architecture

Built on **FastAPI**, with a strict separation between API surface and service logic.

| Domain | Purpose |
|---|---|
| `health` | Backend availability and service status |
| `prices` | Market-price information |
| `signals` | Generated and stored trading signals |
| `charts` | Data feeding technical visualizations |
| `news` | Financial-news feed |
| `calendar` | Macroeconomic-event calendar |
| `backtest` | Historical performance and strategy metrics |
| `alphabot` | Contextual conversational intelligence |
| `websocket` | Real-time dashboard push |

**Service modules** — `agent_service`, `backtest_service`, `calendar_service`, `change_detector`, `chart_service`, `demo_service`, `live_context_service`, `news_monitor`, `news_service`, `price_service`, `signal_store`, `signal_validator`.

---

## Frontend Dashboard

**React 19 · TypeScript · Vite · Tailwind CSS 4 · Recharts**

<table>
<tr><th align="left">Core components</th><th align="left">Chart components</th><th align="left">Performance components</th></tr>
<tr valign="top">
<td>
<code>SignalCard</code><br/>
<code>TickerStrip</code><br/>
<code>AlphaBotPanel</code><br/>
<code>NewsFeedPanel</code><br/>
<code>EventCalendarPanel</code><br/>
<code>NextUpdateCountdown</code>
</td>
<td>
<code>PriceChart</code><br/>
<code>RSIChart</code><br/>
<code>MACDChart</code><br/>
<code>BollingerBandsChart</code><br/>
<code>VolatilityChart</code><br/>
<code>CorrelationHeatmap</code><br/>
<code>AgentConfidenceChart</code><br/>
<code>RiskChart</code>
</td>
<td>
<code>EquityCurveChart</code><br/>
<code>DrawdownChart</code><br/>
<code>MetricsDashboard</code><br/>
<code>PairComparison</code><br/>
<code>PositionSizeCalculator</code><br/>
<code>RecentTradesList</code>
</td>
</tr>
</table>

**Pages** — Dashboard · History · Performance · Settings
**Hooks** — `useSignals` · `useAlphaBot` · `useNotifications`

---

## Backtesting and Performance Analytics

Historical evaluation runs through dedicated scripts and backend services:

```
fx_alphalab/scripts/backtest.py                       →  signal replay engine
fx_alphalab/scripts/compute_backtest_stats.py         →  metric computation
Deployment/Backend/app/services/backtest_service.py   →  API-facing results
```

The performance layer answers one question: *would these signals have produced consistent, risk-controlled performance under the project's test conditions?* Output covers equity curve, drawdown, win rate, cumulative pips, profit factor, Sharpe ratio, and per-pair comparison.

---

## MLOps and Monitoring

| Concern | Implementation |
|---|---|
| **Containerization** | `Dockerfile.backend` · `Dockerfile.frontend` · `Dockerfile.training` — one image per lifecycle concern |
| **Orchestration** | `docker-compose.yml` at repo root, environment-driven configuration |
| **Experiment tracking** | MLflow (`mlops/mlflow/`) — metric logging, run comparison, reproducibility |
| **Monitoring** | Prometheus (`mlops/monitoring/prometheus.yml`) — operational metric collection |
| **Automation** | `Makefile` targets for common workflows |

Separating the training image from the serving images means model iteration never destabilizes the running platform.

---

## Technical Validation

<table>
<tr valign="top">
<td width="25%"><b>API validation</b><br/>endpoint availability, response consistency, signal retrieval, health status, data-service reliability</td>
<td width="25%"><b>Real-time validation</b><br/>WebSocket stability, update synchronization, signal refresh, dashboard consistency, event propagation</td>
<td width="25%"><b>Functional validation</b><br/>technical signals, macro context, sentiment output, conviction filtering, chart rendering, AlphaBot interaction</td>
<td width="25%"><b>Integration validation</b><br/>full path from data layer → agents → orchestrator → services → REST/WS → dashboard</td>
</tr>
</table>

---

## Performance Results

<div align="center">

| Metric | Result |
|:---|:---:|
| API success rate | **99.6 %** |
| Average API response time | **< 200 ms** |
| WebSocket stability | **99.2 %** |
| Real-time synchronization accuracy | **98.7 %** |

</div>

> These are **technical validation results** measured during the academic development and demonstration phase. They describe system reliability, not financial performance, and are not a guarantee of trading returns.

---

## Technology Stack

<details open>
<summary><b>Artificial Intelligence & Data</b></summary>

| Category | Technologies |
|---|---|
| AI architecture | Multi-agent system with central orchestration |
| Agents | Technical · Macroeconomic · Sentiment |
| Decision layer | Conviction gate + orchestrator |
| Retrieval | ChromaDB, sentence-transformers, keyword fallback |
| LLM reasoning | Groq (hosted) · Ollama (local) |
| Models | PyTorch, XGBoost, scikit-learn, hmmlearn |
| Data | Pandas, NumPy, SciPy, PyArrow, Parquet / CSV / JSON |
| Feeds | yfinance, feedparser, custom macro feeds |
</details>

<details>
<summary><b>Backend</b></summary>

| Category | Technologies |
|---|---|
| Framework | FastAPI + Uvicorn |
| Communication | REST API, WebSocket |
| Scheduling | APScheduler, Watchdog |
| Validation | Pydantic v2, pydantic-settings |
| Configuration | Environment variables (`.env`) |
| Architecture | Modular service layer |
</details>

<details>
<summary><b>Frontend</b></summary>

| Category | Technologies |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.6 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 4, IBM Plex Sans / Mono |
| Charts | Recharts + custom analytical components |
| Quality | ESLint, typescript-eslint |
</details>

<details>
<summary><b>MLOps & DevOps</b></summary>

| Category | Technologies |
|---|---|
| Containers | Docker |
| Orchestration | Docker Compose |
| Experiment tracking | MLflow |
| Monitoring | Prometheus |
| Automation | Makefile |
</details>

---

## Repository Structure

```
fx-alphalabs/
│
├── Deployment/
│   ├── Backend/                       # FastAPI application
│   │   ├── app/
│   │   │   ├── api/                   # alphabot · backtest · calendar · charts
│   │   │   │                          # health · news · prices · signals · websocket
│   │   │   └── services/              # agent · backtest · calendar · change_detector
│   │   │                              # chart · live_context · news · price
│   │   │                              # signal_store · signal_validator
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   │
│   └── Frontend/my-app/               # React + TypeScript + Vite dashboard
│       ├── src/
│       │   ├── components/            # core · charts/ · performance/
│       │   ├── hooks/                 # useSignals · useAlphaBot · useNotifications
│       │   ├── pages/                 # History · Performance · Settings
│       │   ├── config/ · utils/
│       ├── package.json
│       └── vite.config.ts
│
├── fx_alphalab/                       # Core AI package
│   ├── fx_alphalab/
│   │   ├── agents/                    # technical · macro · sentiment · conviction_gate
│   │   ├── orchestrator/              # orchestrator.py
│   │   ├── data_feed/                 # macro · news · news_rag · price
│   │   ├── memory/                    # context_store.py
│   │   ├── postprocessor/             # conviction · corrector · monitor
│   │   └── config/ · core/ · data/
│   ├── outputs/                       # models/ models_v3/ models_v4/ signals.csv
│   └── scripts/                       # run_agent · train_agents · backtest
│                                      # compute_backtest_stats
│
├── mlops/
│   ├── docker/                        # Dockerfile.backend · .frontend · .training
│   ├── mlflow/                        # mlflow_tracking.py · mlruns/
│   └── monitoring/                    # prometheus.yml
│
├── screenshots/
├── mockup/
├── docker-compose.yml
├── Makefile
├── LICENSE
└── README.md
```

---

## Platform Showcase

### Live Dashboard

<div align="center">
  <img src="screenshots/dashboard.jpg" alt="FX AlphaLab live dashboard" width="100%"/>
</div>

A unified view of live signals per pair, conviction scoring, per-agent breakdown, market context, news flow, and upcoming economic events — with signal age surfaced explicitly so stale calls are never mistaken for fresh ones.

### Detailed Signals

<div align="center">
  <img src="screenshots/signals.jpg" alt="FX AlphaLab detailed signal analysis" width="100%"/>
</div>

Every signal expands into direction, confidence, conviction, per-analyst reasoning (macro / technical / sentiment), contextual news, risk parameters, and AlphaBot-generated explanations — plus entry, stop, target and position size.

### Strategy Performance

<div align="center">
  <img src="screenshots/performance.jpg" alt="FX AlphaLab strategy performance dashboard" width="100%"/>
</div>

Signal quality and strategy effectiveness: win rate, cumulative pips, profit factor, average win/loss, maximum drawdown, Sharpe ratio, and pair-level breakdown.

### Signal History

<div align="center">
  <img src="screenshots/history.jpg" alt="FX AlphaLab signal history ledger" width="100%"/>
</div>

A full audit trail — timestamp, pair, direction, confidence, agreement level, market regime, price, and reasoning driver — exportable to CSV for offline analysis.

---

## Getting Started

### Prerequisites

`Git` · `Docker` + `Docker Compose` · `Python 3.10+` · `Node.js 18+` and `npm` (for local frontend development)

### 1 · Clone

```bash
git clone https://github.com/Ghazouaniwalae/fx-alphalabs.git
cd fx-alphalabs
```

### 2 · Configure the environment

Copy each example file and fill in the required values:

```bash
cp Deployment/Backend/.env.example Deployment/Backend/.env
```

```bash
cp Deployment/Frontend/my-app/.env.example Deployment/Frontend/my-app/.env
```

```bash
cp fx_alphalab/.env.example fx_alphalab/.env
```

<details>
<summary>On Windows PowerShell</summary>

```powershell
Copy-Item Deployment\Backend\.env.example Deployment\Backend\.env
Copy-Item Deployment\Frontend\my-app\.env.example Deployment\Frontend\my-app\.env
Copy-Item fx_alphalab\.env.example fx_alphalab\.env
```
</details>

### 3 · Run the full stack with Docker

```bash
docker compose up --build
```

<details>
<summary>Other Compose commands</summary>

```bash
docker compose up --build -d     # detached
docker compose ps                # running services
docker compose logs -f           # follow logs
docker compose down              # stop the stack
```
</details>

---

### Running components individually

<details>
<summary><b>Backend (FastAPI)</b></summary>

```bash
cd Deployment/Backend && python -m venv .venv
```

Activate — Windows: `.venv\Scripts\activate` · Linux/macOS: `source .venv/bin/activate`

```bash
pip install -r requirements.txt
```

```bash
uvicorn main:app --reload
```

Interactive API docs: **http://localhost:8000/docs**
</details>

<details>
<summary><b>Frontend (Vite dev server)</b></summary>

```bash
cd Deployment/Frontend/my-app && npm install && npm run dev
```

Vite prints the local URL on startup.
</details>

<details>
<summary><b>Core AI package</b></summary>

```bash
cd fx_alphalab && python -m venv .venv
```

```bash
pip install -r requirements.txt
```

Available entry points:

| Script | Purpose |
|---|---|
| `scripts/run_agent.py` | Run the multi-agent pipeline |
| `scripts/train_agents.py` | Train agent models |
| `train_agents_v3.py` / `train_v4.py` | Versioned training pipelines |
| `scripts/backtest.py` | Replay signals over historical data |
| `scripts/compute_backtest_stats.py` | Compute performance metrics |

Exact invocation depends on the operation and your environment configuration.
</details>

---

## Team

FX AlphaLab was developed by a multidisciplinary team of six engineering students.

| Team Member | Role |
|---|---|
| **Wala Eddine Ghazouani** | Project Lead |
| **Bahaeddine Amara** | Project Manager |
| **Hassan Zorkot** | Data Scientist |
| **Amen Allah Ben Aissa** | Data Scientist |
| **Sarah Faleh** | Solution Architect |
| **Ali Zouaoui** | Solution Architect |

### My Role — Wala Eddine Ghazouani, Project Lead

I led the project end to end and owned the **Macro Agent** in full — from macroeconomic data ingestion and feature engineering through indicator evaluation, event processing, regime detection, model training, and integration into the orchestration layer.

Beyond that scope I contributed across the other agent pipelines and supported the technical, sentiment, orchestration, and post-processing workstreams, alongside the integration work that connects the AI layer to the backend services and dashboard.

---

## Project Scope

FX AlphaLab was developed over **five months** as a Data Science Integrated Project at **École Supérieure Privée d'Ingénierie et de Technologies (ESPRIT)**, in collaboration with **VALUE**.

The work covered the complete technical lifecycle: data engineering and feature extraction, machine learning and AI model development, multi-agent architecture and signal fusion, backend API and frontend development, real-time processing and monitoring, and deployment infrastructure.

---

## License

Released under the [MIT License](LICENSE).

---

## Acknowledgements

Sincere thanks to **Mohamed Aziz Kasseb** and **Olfa Layouni** for their guidance, feedback, and continuous support throughout this project.

Thanks as well to **Bahaeddine Amara**, **Sarah Faleh**, **Ali Zouaoui**, **Hassan Zorkot**, and **Amen Allah Ben Aissa** for the collaboration, dedication, and teamwork invested during this journey.

---

<div align="center">

**FX AlphaLab** — *turning market noise into explainable intelligence.*

</div>
