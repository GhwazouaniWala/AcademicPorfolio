export const profile = {
  name: "Wala Eddine Ghazouani",
  role: "AI / Machine Learning Engineer",
  subrole: "Final-Year Engineering Student, ESPRIT",
  location: "Ariana, Tunisia",
  availability: "Available Jan – Jun 2027 · 6-month final-year internship",
  relocation: "Open to relocation — Europe / Canada",
  email: "walaghazouani.work@gmail.com",
  linkedin: "https://linkedin.com/in/ghazouani-wala-eddine",
  github: "https://github.com/GhwazouaniWala",
  huggingface: "https://huggingface.co/Ghazouaniwala",
  summary:
    "Final-year Data Science engineering student who takes AI systems from fine-tuning through to a deployed, monitored application. Two AI internships at Wevioo, two speech models published on Hugging Face, and project lead of a six-person multi-agent platform delivered with an industry partner. Focused on LLMs, multimodal and agentic systems, and the MLOps that keeps them running.",
  stats: [
    { value: "2", label: "AI internships @ Wevioo" },
    { value: "2", label: "models published on Hugging Face" },
    { value: "7", label: "shipped AI systems" },
    { value: "6", label: "person team led (FX AlphaLab)" },
  ],
};

export const skills = [
  {
    group: "Languages",
    items: ["Python", "SQL", "Java", "C", "TypeScript / JavaScript"],
  },
  {
    group: "AI & ML",
    items: [
      "Machine Learning",
      "Deep Learning",
      "Computer Vision",
      "NLP",
      "Large Language Models",
      "Retrieval-Augmented Generation",
      "Fine-tuning (LoRA / PEFT)",
      "Multimodal fusion",
      "PyTorch",
      "Hugging Face Transformers",
      "TensorFlow / Keras",
      "scikit-learn",
      "XGBoost",
      "ONNX",
      "OpenCV",
      "spaCy",
      "LangGraph",
      "ChromaDB",
      "vLLM",
      "wav2vec2",
      "Whisper",
      "TrOCR",
    ],
  },
  {
    group: "MLOps & Backend",
    items: [
      "Docker",
      "MLflow",
      "Prometheus",
      "CI/CD",
      "Git",
      "pytest",
      "FastAPI",
      "Flask",
      "REST",
      "WebSocket",
      "Pydantic",
      "SQLAlchemy",
      "Spring Boot",
      "MySQL",
      "Pandas",
      "NumPy",
      "React",
      "Vite",
      "Tailwind CSS",
      "JavaFX",
      "Agile / Scrum",
      "UML",
    ],
  },
];

export const experience = [
  {
    role: "AI Engineering Intern",
    org: "Wevioo",
    place: "Ariana, Tunisia",
    period: "Jun 2026 – Aug 2026",
    points: [
      "Designed and shipped Solace, a real-time multimodal AI coaching system: full-duplex voice over WebSocket, concurrent facial (EfficientNet-B0, ONNX) and vocal (wav2vec2-XLSR-53) emotion classifiers, and a RAG layer over 603 clinical documents.",
      "Fine-tuned and published two models to Hugging Face (7-class speech-emotion classifier; F5-TTS Tunisian Derja synthesis) and cut end-to-end latency 4.1x by restructuring the inference pipeline for streaming and parallel execution.",
    ],
  },
  {
    role: "AI Engineer",
    org: "Upwork",
    place: "Remote — Freelance",
    period: "2025 – Present",
    points: [
      "Build AI systems for international clients: RAG chatbots over client knowledge bases, Python AI agents and workflow automation, and web-scraping pipelines that turn scattered sources into structured data.",
      "Own scoping through deployment, integration, and handover.",
    ],
  },
  {
    role: "Software Engineering Intern",
    org: "Wevioo",
    place: "Ariana, Tunisia",
    period: "Jul 2025 – Aug 2025",
    points: [
      "Built MeetSummary (Summify), a self-hosted Microsoft Teams meeting summariser: Graph OAuth 2.0, automated OneDrive recording discovery, Whisper transcription, LLM summarisation, and PDF export.",
      "Delivered solo over three Scrum sprints (18 user stories, full UML modelling) on a hybrid JavaFX + Flask architecture with a REST bridge and MySQL data model.",
    ],
  },
];

export const education = [
  {
    degree: "Engineering Degree, Computer Science — Data Science",
    school: "ESPRIT, Ariana, Tunisia",
    period: "Sep 2024 – Jun 2027",
  },
  {
    degree: "Preparatory Cycle for Engineering Studies — Maths & Physics",
    school: "IPEI Bizerte, Tunisia",
    period: "Sep 2022 – Jun 2024",
  },
];

export const certifications = [
  {
    name: "Applications of AI for Anomaly Detection",
    issuer: "NVIDIA Deep Learning Institute",
    issued: "Apr 2026",
    year: "2026",
    credentialId: "tsySqX7jSfWy5q22OMI6hw",
    url: "https://learn.nvidia.com/certificates?id=tsySqX7jSfWy5q22OMI6hw",
  },
  {
    name: "LLM Engineering in Practice with Streamlit and OpenAI",
    issuer: "365 Data Science",
    issued: "Mar 2026",
    year: "2026",
    credentialId: "CC-D474221DCF",
    url: "https://learn.365datascience.com/certificates/CC-D474221DCF/",
  },
  {
    name: "Fundamentals of Deep Learning",
    issuer: "NVIDIA Deep Learning Institute",
    issued: "Jan 2026",
    year: "2026",
    credentialId: "1tO0Ys3ITkGJkXM3sgBKrQ",
    url: "https://learn.nvidia.com/certificates?id=1tO0Ys3ITkGJkXM3sgBKrQ",
  },
  {
    name: "Convolutional Neural Networks with TensorFlow in Python",
    issuer: "365 Data Science",
    issued: "Nov 2025",
    year: "2025",
    credentialId: "CC-C804599CCC",
    url: "https://learn.365datascience.com/certificates/CC-C804599CCC/",
  },
  {
    name: "Big Data 101",
    issuer: "United Latino Students Association",
    issued: "Oct 2025",
    year: "2025",
    // The identifier is an IBM CognitiveClass course code, not a certificate
    // hash, so there is no public verification URL to link.
    credentialId: "course-v1:CognitiveClass BD0101EN v2",
    url: null,
  },
  {
    name: "Hadoop 101",
    issuer: "United Latino Students Association",
    issued: "Oct 2025",
    year: "2025",
    credentialId: "course-v1:BigDataUniversity BD0111EN v1",
    url: null,
  },
  {
    name: "Building AI Agents with Multimodal Models",
    issuer: "NVIDIA Deep Learning Institute",
    issued: "Jan 2025",
    year: "2025",
    credentialId: "F2g-DA5JToWxYr22V1Y7Tg",
    url: "https://learn.nvidia.com/certificates?id=F2g-DA5JToWxYr22V1Y7Tg",
  },
  {
    name: "Generative AI with Diffusion Models",
    issuer: "NVIDIA Deep Learning Institute",
    issued: "Jan 2025",
    year: "2025",
    credentialId: "TauXuWfURMOBYNutOVkopw",
    url: "https://learn.nvidia.com/certificates?id=TauXuWfURMOBYNutOVkopw",
  },
];

export const languages = [
  { name: "Arabic", level: "Native" },
  { name: "French", level: "Fluent — C1" },
  { name: "English", level: "Professional — C1" },
];

// Featured = large instrument-panel cards. Secondary = compact cards.
export const featuredProjects = [
  {
    id: "solace",
    name: "Solace",
    tagline: "Real-time multimodal AI psychological coach",
    period: "Jun 2026 – Aug 2026 · Wevioo internship",
    motif: "waveform",
    description:
      "A voice-first coach that reads emotion off your face and your voice at once, then answers through a named clinical technique instead of a platitude — in English, French, or Tunisian Derja.",
    stack: [
      "wav2vec2-XLSR-53 (fine-tuned)",
      "F5-TTS (fine-tuned, Derja)",
      "EfficientNet-B0 · ONNX",
      "MediaPipe",
      "ChromaDB RAG",
      "FastAPI · WebSocket",
      "React 19 · Zustand",
    ],
    metrics: [
      { label: "clinical documents retrieved from", value: "603" },
      { label: "latency cut via streaming pipeline", value: "4.1×" },
      { label: "models fine-tuned & published to HF", value: "2" },
    ],
    detail:
      "Two independent emotion classifiers run concurrently — facial expression/gaze/self-touch from webcam, vocal tone from a fine-tuned wav2vec2 model — and are never averaged away when they disagree. Every piece of advice is retrieved from CBT, Motivational Interviewing, Gottman, NVC, and DBT source material and cited by technique name; the session debrief timestamps each observation to the moment it happened.",
    repo: "https://github.com/GhwazouaniWala/Solace",
  },
  {
    id: "fx-alphalab",
    name: "FX AlphaLab",
    tagline: "Multi-agent financial intelligence platform",
    period: "Feb 2026 – Jun 2026 · ESPRIT × VALUE, project lead",
    motif: "candlestick",
    description:
      "A five-layer market-intelligence pipeline — technical, macro, sentiment, AI reasoning, and operations — where specialised agents analyse independently and a conviction gate decides what actually reaches the user.",
    stack: [
      "PyTorch · XGBoost · scikit-learn",
      "ChromaDB · sentence-transformers",
      "FastAPI · WebSocket",
      "MLflow · Prometheus",
      "Docker Compose",
      "React 19 · TypeScript · Vite",
    ],
    metrics: [
      { label: "API success rate", value: "99.6%" },
      { label: "avg. API response time", value: "<200ms" },
      { label: "WebSocket stability", value: "99.2%" },
    ],
    detail:
      "Led a six-person team over five months, owning the macroeconomic agent end to end — ingestion, feature engineering, market-regime detection, training. Set up the full MLOps layer: separate Docker images for training vs. serving, MLflow experiment tracking, Prometheus monitoring, and backtesting on win rate, profit factor, drawdown, and Sharpe ratio. A research and decision-support platform — no autonomous real-money trading.",
    repo: "https://github.com/GhwazouaniWala/fx-alphalabs",
  },
  {
    id: "critiq",
    name: "Critiq",
    tagline: "Multi-agent brand & UX analyzer",
    period: "Apr 2026 – Jun 2026",
    motif: "radar",
    description:
      "Six parallel agents score a website across 14 weighted UX dimensions, grounded in a corpus of published UX research, and deliver a full audit in under three minutes.",
    stack: [
      "LangGraph StateGraph",
      "vLLM · Llama 3.1 70B",
      "ChromaDB",
      "FastAPI",
      "Playwright",
      "React",
    ],
    metrics: [
      { label: "UX dimensions scored", value: "14" },
      { label: "parallel agents orchestrated", value: "6" },
      { label: "full audit delivered in", value: "<3 min" },
    ],
    detail:
      "Self-hosted Llama 3.1 70B on vLLM behind retries, a circuit breaker, and a deterministic heuristic fallback per dimension — the audit degrades gracefully instead of failing outright. Every score is grounded in a ChromaDB corpus of NN/g, Baymard, and WCAG 2.1 research rather than model opinion.",
    repo: "https://github.com/GhwazouaniWala/Critiq",
  },
  {
    id: "wathiqa",
    name: "Wathiqa",
    tagline: "Arabic handwritten document intelligence",
    period: "Mar 2026 – May 2026",
    motif: "script-grid",
    description:
      "A TrOCR vision-encoder/decoder adapted to handwritten Tunisian Arabic, routing each field type to a purpose-built engine and registering pages with SIFT keypoints and RANSAC homography.",
    stack: [
      "TrOCR · PyTorch",
      "OpenCV",
      "EasyOCR",
      "FastAPI",
      "SQLAlchemy",
      "pytest",
    ],
    metrics: [
      { label: "Arabic vocabulary tokens", value: "30k" },
      { label: "tests incl. cross-tenant checks", value: "123" },
      { label: "multi-tenant isolation", value: "structural" },
    ],
    detail:
      "Data isolation is enforced structurally at the session layer, not by convention — with an append-only audit log and a dedicated cross-tenant test suite, because a document-intelligence tool that leaks between tenants isn't a shippable one.",
    repo: "https://github.com/GhwazouaniWala/Wathiqa",
  },
];

export const secondaryProjects = [
  {
    id: "neurashop",
    name: "NeuraShop",
    tagline: "AI-assisted e-commerce listing platform",
    stack: ["BLIP", "ABSA sentiment", "EfficientNet-B0", "RAG chatbot", "OpenCV", "Flask"],
    description:
      "Snap a photo, and six AI modules — captioning, categorisation, sentiment, defect detection, and a catalogue-grounded RAG support bot — turn it into a published, WCAG-compliant listing in about 60 seconds.",
    repo: "https://github.com/GhwazouaniWala/NeuraShop",
  },
  {
    id: "summify",
    name: "Summify (MeetSummary)",
    tagline: "Self-hosted Teams meeting summariser",
    stack: ["Whisper", "LLM summarisation", "JavaFX", "Flask", "MySQL"],
    description:
      "Microsoft OAuth login, automated OneDrive recording discovery, Whisper transcription, and three-format LLM summaries exported straight to PDF. Delivered solo across three real Scrum sprints.",
    repo: "https://github.com/GhwazouaniWala/Summify",
  },
  {
    id: "water-potability",
    name: "Water Potability MLOps",
    tagline: "Notebook-to-pipeline MLOps refactor",
    stack: ["scikit-learn", "XGBoost", "Makefile", "Reproducible pipelines"],
    description:
      "A coursework notebook rebuilt into named, testable stages — prepare, train, evaluate, persist — with leakage prevention, 5-fold CV, and a bundled model + preprocessing artifact for consistent train/serve behaviour.",
    repo: "https://github.com/GhwazouaniWala/water-potability-Pipeline",
  },
];
