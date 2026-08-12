<div align="center">

# NeuraShop 🛒⚡

### *Commerce that thinks before it sells*

**E-Commerce Intelligent & Inclusif** — six deep-learning modules, one marketplace, zero manual data entry.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![HuggingFace](https://img.shields.io/badge/🤗_Transformers-FFD21E?style=for-the-badge)](https://huggingface.co)

[![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![torchvision](https://img.shields.io/badge/torchvision-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/vision)
[![Pillow](https://img.shields.io/badge/Pillow-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python-pillow.org)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Google OAuth](https://img.shields.io/badge/Google_Identity-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/identity)

![Models](https://img.shields.io/badge/AI_modules-6-4f6f8f?style=flat-square)
![Categorizer](https://img.shields.io/badge/categorizer_F1-97.37%25-6f9a8d?style=flat-square)
![Classes](https://img.shields.io/badge/product_classes-14-6f9a8d?style=flat-square)
![License](https://img.shields.io/badge/license-academic-b98a5e?style=flat-square)

</div>

---

## 🎤 Real talk before we start

Big up — this whole thing started as a **university group project**, six heads in one repo, and the original team version lives right here:

### 👉 **https://github.com/Ghazouaniwalae/4ds-deep**

**s/o to the squad** who put in the work on the base build 🙏

| Team Member |
|---|
| **Wala Eddine Ghazouani** |
| **Bahaeddine Amara** |
| **Amen Allah Ben Aissa** |
| **Hassan Zorkot** |
| **Ali Zouaoui** |
| **Sarah Faleh** |

I'm **Wala Eddine Ghazouani**, and on the AI side **I built the product categorization model** (Objective 4 — the EfficientNet-B0 classifier doing 97.4% val accuracy on 14 classes). This repo here is my continuation of that work: same brains, brand new face. Everything the team shipped is still in there — I didn't gut nobody's module. Respect where it's due. 💯

---

## 📸 The look

Dark mode by default, light mode one tap away, and every screen designed like it's going into a pitch deck.

### Marketplace — dark
![Catalogue dark](docs/screenshots/01-catalog-dark.png)

### Marketplace — light
![Catalogue light](docs/screenshots/02-catalog-light.png)

### Product page — every module firing on one screen
![Product detail](docs/screenshots/03-product-detail.png)

### Aspect-based sentiment, decoded
![Sentiment](docs/screenshots/04-sentiment.png)

### Insights dashboard
![Dashboard](docs/screenshots/05-dashboard.png)
![Dashboard light](docs/screenshots/06-dashboard-light.png)

### Seller studio — the 4-step AI publish wizard
![Seller studio](docs/screenshots/07-seller-studio.png)

### Orders · Auth · ⌘K palette · Cart
| | |
|---|---|
| ![Orders](docs/screenshots/08-orders.png) | ![Auth](docs/screenshots/09-auth-modal.png) |
| ![Command palette](docs/screenshots/10-command-palette.png) | ![Cart](docs/screenshots/11-cart-drawer.png) |

---

## 💡 The business story — why this even exists

Real talk: marketplaces are drowning in **garbage listings**.

Somebody snaps a blurry photo in a dark room, types *"chair good condition"*, dumps it in the wrong category, writes no alt-text, and bounces. Now:

- ♿ **Blind and low-vision shoppers get locked out.** No alt-text = the screen reader says "image". That's a whole customer segment gone, and in the EU it's not just rude, it's a compliance problem (European Accessibility Act).
- 🔍 **Search dies.** Wrong category, no metadata, item never surfaces. Seller thinks the platform is trash and leaves.
- 📉 **Trust dies.** Blurry, dark, low-res photos → the buyer assumes the product is as sketchy as the picture. Conversion tanks.
- 🧾 **Reviews pile up unread.** 400 reviews and no human is reading them. Buyer can't tell if the complaint is about the *battery* or the *shipping*.
- 💬 **Support gets buried** answering "does this work for gaming?" a thousand times a day.

Manual moderation don't scale. Hiring people to caption images and fix categories is expensive and slow.

**So NeuraShop moves the intelligence to the moment of upload.** You drop one photo. Before you even type a price, the platform already:

1. wrote you a WCAG-compliant alt-text,
2. picked your category with 97% accuracy,
3. graded your photo — and if it's weak, it *fixes it for you* and shows you the before/after,
4. and the moment your listing is live, it's already wired into visual recommendations, sentiment mining and the shopping assistant.

Nobody fills out a form. The AI fills it out and the human just confirms.

### 🎯 Use cases

| Who | What they get |
|---|---|
| **Seller (casual)** | Snap → publish in ~60s. No writing, no category-hunting, no photo-editing skills needed. |
| **Seller (pro shop)** | Insights dashboard: revenue trend, catalogue mix, per-product stock/sentiment/sales, AI module health. |
| **Buyer** | Verified photo quality, honest AI review digest, "what do people actually complain about", visual similar-item discovery. |
| **Blind / low-vision buyer** | Every listing carries generated alt-text, length-validated for WCAG (5–25 words). |
| **Platform / moderation team** | Automated quality gate at the door — bad images never reach the catalogue. |
| **Support** | RAG chatbot answers catalogue questions from the real product data, no hallucinated SKUs. |

---

## 🏗 Architecture

Flask app, one shared JSON catalogue, six blueprints that each own a folder. Modules never touch each other's code — they talk through `database.py` and through HTTP.

```
                     ┌──────────────────────────────────┐
                     │   static/index.html (SPA)        │
                     │   vanilla JS · dark/light · ⌘K   │
                     │   Google Identity Services       │
                     └───────────────┬──────────────────┘
                                     │  fetch  /api/*
                     ┌───────────────▼──────────────────┐
                     │        app.py — Flask + CORS     │
                     │   blueprint registry · catalogue │
                     └───────────────┬──────────────────┘
        ┌──────────┬─────────┬───────┼────────┬──────────┬──────────┐
        ▼          ▼         ▼       ▼        ▼          ▼          │
   ┌─────────┐┌─────────┐┌────────┐┌───────┐┌────────┐┌──────────┐  │
   │ alt_text││sentiment││recomm. ││categor││chatbot ││ defect   │  │
   │  BLIP   ││ASE+ABSA ││ResNet50││EffNet ││RAG+GPT2││ OpenCV   │  │
   │         ││         ││+TF-IDF ││  B0   ││        ││+enhancer │  │
   └────┬────┘└────┬────┘└───┬────┘└───┬───┘└───┬────┘└────┬─────┘  │
        └──────────┴─────────┴─────────┴────────┴──────────┴────────┘
                                     │
                     ┌───────────────▼──────────────────┐
                     │  database.py  →  products.json   │
                     │  single source of truth          │
                     └──────────────────────────────────┘
```

**Shared product schema** — every module reads and writes the same shape:

```json
{
  "id": "prod_001",
  "name": "Wireless Noise-Cancelling Headphones",
  "image_path": "static/images/prod_001.jpg",
  "price": 129.99,
  "description": "...",
  "seller": "AudioTech Store",
  "seller_id": "",
  "category":        "electronics",   ← Obj 4 writes here
  "alt_text":        "Black wireless…",← Obj 1 writes here
  "sentiment_score": 0.9949,          ← Obj 2 writes here
  "sentiment_label": "positive",      ← Obj 2 writes here
  "image_ok":        true,            ← Obj 6 writes here
  "reviews": ["…"]
}
```

### 🔁 Pipeline 1 — the **publish** pipeline (seller side)

This is the money path. One image in, a full listing out.

```
 photo (base64)
      │
      ├──────────────► POST /api/alt-text    → BLIP caption → WCAG length check (5–25 words)
      │                                        → alt_text + word_count + wcag_compliant
      │
      ├──────────────► POST /api/categorize  → EfficientNet-B0 → softmax → top-3
      │                                        → category + confidence
      │
      └──────────────► POST /api/check-image → OpenCV heuristics (Laplacian / brightness /
                                               contrast / resolution) → quality_score
                                                   │
                                        score < 0.55 ?
                                            │        │
                                           no       yes
                                            │        │
                                            │        └─► CNN enhancer (enhancer.pth)
                                            │            → re-score → before/after preview
                                            │            → "Use enhanced image" if it clears
                                            ▼
                             ┌──────────────────────────────┐
                             │ gate: image_ok AND alt_text  │
                             │       AND category           │
                             └──────────────┬───────────────┘
                                            ▼
                              POST /api/products → products.json → live in catalogue
```

The three model calls fire **in parallel** (`Promise.allSettled`) so the UI shows one spinner, not three. If one service dies the other two still render — the gate just won't open.

### 🔁 Pipeline 2 — the **discovery** pipeline (buyer side)

```
 product page
      │
      ├─► POST /api/sentiment      ASE (token-classification) extracts aspect terms
      │                            → ABSA (sequence-classification) scores each (text, aspect) pair
      │                            → per-review score + aspect_summary + overall label
      │                            → writes sentiment_score / sentiment_label back to the catalogue
      │
      ├─► GET  /api/similar/<id>   ResNet-50 2048-d visual embedding ⊕ TF-IDF text embedding
      │                            → α-weighted fusion (α = 0.75 image) → L2 normalize
      │                            → cosine similarity → top-K
      │
      └─► POST /api/chat           MiniLM embeds the question + catalogue → cosine → top-3 products
                                   → RAG context → GPT-2 generation
                                   → fallback chain: Ollama → Groq → rule-based (always answers)
```

---

## 🧠 The AI, module by module

Six objectives, six model families. Here's what's actually running under the hood — not the marketing version.

### 🏷 Objective 4 — Product categorization *(this one's mine)*

**`categorization/`** · `EfficientNet-B0` fine-tuned end-to-end · `product_categorizer_v3.pth`

This is the module I built, so let me go deep on it.

**Why EfficientNet-B0 and not CLIP zero-shot?** Zero-shot CLIP is cute for a demo but it's vague on fine-grained retail classes — it'll happily confuse *Bags & Luggage* with *Accessories*, and you get no control over the label space. A fine-tuned CNN locks the taxonomy down, runs way lighter on CPU, and the numbers speak.

**Architecture** — ImageNet-pretrained EfficientNet-B0 backbone, original classifier ripped off and replaced with a custom deep head:

```
EfficientNet-B0 backbone  →  1280-d features
        ↓
  Dropout(0.4)
  Linear(1280 → 512) → BatchNorm1d → SiLU
  Dropout(0.2)
  Linear(512 → 256)  → BatchNorm1d → SiLU
  Linear(256 → 14)   → softmax
```

Design choices that mattered:
- **Two-stage bottleneck (1280→512→256)** instead of a single linear layer — gives the head enough capacity to separate visually-adjacent retail classes without overfitting the backbone.
- **Aggressive dropout up front (0.4)** right after the frozen-ish feature extractor, lighter (0.2) deeper in — kills co-adaptation where the signal is richest.
- **BatchNorm + SiLU** (not ReLU) to stay consistent with EfficientNet's own activation family, keeps gradients smooth through the head.
- **224×224, ImageNet mean/std** — standard normalization, so the pretrained weights aren't fighting the input distribution.
- **TTA (test-time augmentation)** at eval to squeeze the last point of accuracy.

**14 classes:** `Accessories` · `Bags & Luggage` · `Beauty & Makeup` · `Clothing` · `Computers & Accessories` · `Eyewear` · `Footwear` · `Fruits & Vegetables` · `Furniture` · `Jewelry` · `Packaged Food` · `Phones & Tablets` · `Skincare & Fragrance` · `Watches`

**Results** (straight out of the checkpoint metadata, no rounding-up):

| Metric | Score |
|---|---|
| Best validation accuracy | **97.44%** |
| Test accuracy | **97.35%** |
| Test F1 (macro) | **97.37%** |
| Test top-3 accuracy | **99.60%** |
| Test accuracy **+ TTA** | **97.73%** |
| Test F1 **+ TTA** | **97.74%** |

That top-3 at **99.6%** is the one I'm proudest of — it means the right category is basically *always* in the shortlist, which is exactly what you want for a UI that offers the seller an editable suggestion instead of a hard decision.

**Serving:** lazy-loaded and cached at module level, so the `.pth` hits disk once per process. Returns `category`, `confidence`, and `top3` — the frontend shows the winner and keeps the runners-up available.

```bash
curl -X POST http://localhost:5001/api/categorize \
  -H "Content-Type: application/json" \
  -d '{"image_path":"static/images/prod_001.jpg"}'
```

---

### 🖼 Objective 1 — Alt-text generation

**`alt_text/`** · `Salesforce/blip-image-captioning-base`

BLIP — vision transformer encoder + text decoder with cross-attention. Lineage traces back to *Show, Attend and Tell* (Xu et al., 2015), modernized with a transformer decoder instead of the old LSTM+soft-attention stack.

The accessibility part is the part people skip: a caption isn't automatically an alt-text. The route enforces a **WCAG word-count window of 5–25 words** and reports `wcag_compliant` so the UI can flag captions that are too terse ("a chair") or too rambling to be useful to a screen reader. Lazy-loaded (~1.5 GB on first call), accepts `image_path` or `image_b64`.

### 💬 Objective 2 — Aspect-based sentiment (ABSA)

**`sentiment/`** · two-model cascade, HF hub: `UseCondomsKid/ase-model` + `UseCondomsKid/absa-model`

Not a plain "positive/negative" classifier — this is **two heads chained**:

1. **ASE (Aspect Sentiment Extraction)** — token classification with `B-ASP` / `I-ASP` BIO tagging. Walks the wordpiece tokens, stitches `##` subwords back together, and pulls the aspect *terms* out of free text ("battery life", "armrests", "assembly").
2. **ABSA** — sequence classification over the pair `(review_text, aspect)`. Same sentence can be positive about *sound* and negative about *comfort*, and this catches both.

Output is a per-review score, a per-aspect tally, and an overall label that gets written straight back into `products.json`. The frontend turns it into the verdict gauge, the aspect bars, and the colour-coded review cards.

### 🎯 Objective 3 — Multimodal recommendations

**`recommendations/`** · ResNet-50 + TF-IDF late fusion

```
image  → ResNet-50 (classifier head removed) → 2048-d visual embedding
text   → TF-IDF (max_features=100, english stop-words) → sparse → dense → L2 normalize
fusion → concat[ α·image , (1−α)·text ]  with α = 0.75
       → L2 normalize → cosine similarity → top-K
```

Weighted-concatenation late fusion. α = 0.75 leans visual on purpose — on a marketplace, "looks like the thing I'm viewing" beats "shares keywords with it", but the text channel stops it from recommending a black shoe for a black speaker.

### 🤖 Objective 5 — Shopping assistant (RAG)

**`chatbot/`** · `all-MiniLM-L6-v2` retrieval + `GPT-2` generation, with a graceful fallback ladder

1. **Retrieve** — MiniLM embeds the question and every `"{name} {category}"` in the catalogue, cosine ranks, keeps top-3.
2. **Generate** — retrieved products become grounding context for GPT-2. The system prompt hard-forbids inventing SKUs and asks for product IDs in `(prod_001)` form, which the route regex-extracts into `suggested_products`.
3. **Fallback ladder** — `USE_DL_MODEL` → Ollama (`llama3.1`, local) → Groq (`llama-3.1-8b-instant`, hosted) → a rule-based keyword responder that works fully offline. **The chat endpoint never hard-fails.**

### 🔍 Objective 6 — Defect / quality detection

**`defect_detection/`** · OpenCV heuristics + a learned CNN enhancer

Interpretable by design — no black box telling a seller their photo is bad:

| Signal | Method | Threshold |
|---|---|---|
| Sharpness | variance of Laplacian | `< 100.0` → blurry |
| Brightness | grayscale mean | `< 50` dark · `> 220` blown out |
| Contrast | grayscale std | `< 40` → flat |
| Resolution | min dimension | `< 100 px` |

Weighted into a `quality_score`, gated at **0.55**. When it fails, the module doesn't just reject — it runs the **CNN enhancer** (`enhancer.pth`), re-scores the output, and hands the seller a side-by-side original-vs-enhanced with both scores. If the enhanced version clears the gate, one click adopts it and publishing unblocks.

---

## 🔄 What changed from the base version

The team version is the foundation. This fork is a **frontend rebuild + product layer** on top of it. Model code was left alone on purpose.

### 🎨 Full UI rebuild — `static/index.html`

The old shell is preserved at `static/index.legacy.html` so you can diff the two.

| | Base version | NeuraShop |
|---|---|---|
| Theme | Light only | **Dark + light**, tokenised design system, persisted, follows system preference |
| Design | Functional | Rebuilt on a settled 3-tone palette — slate `#4f6f8f` / sage `#6f9a8d` / sand `#b98a5e` |
| Motion | Basically none | Scroll reveals, count-ups, fly-to-cart, staggered cards, skeleton loaders, animated charts |
| Pages | Shop · Detail · Sell | **+ Insights dashboard · Orders · Wishlist** |
| Auth | None (localStorage fingerprint) | **Google Identity Services** + demo mode |
| Search | Basic filter | Live filter **+ ⌘K command palette** |
| Data viz | None | Bar chart, donut, gauges, sparklines, progress meters — all hand-rolled SVG, zero chart libs |

### ✨ New functionality

- 🔐 **Google Sign-In (GIS)** — real JWT decode, avatar, user menu. Selling and checkout are gated behind auth. Drop a client ID in `GOOGLE_CLIENT_ID` and it's production-ready; leave it blank and a demo sign-in mimics the flow so the whole app stays explorable.
- 📊 **Insights dashboard** — revenue trend, catalogue mix donut, per-module health, sentiment distribution, per-product performance table.
- 📦 **Orders** — history, statuses, lifetime spend. Orders placed in-session are real and persist.
- ♡ **Wishlist** — heart any product, persisted locally.
- ⌘ **Command palette** — `Ctrl/⌘ + K`, fuzzy over pages *and* products.
- 🔔 **Notification centre** with unread state.
- 🎟 **Promo codes** — `NEURA10` · `WELCOME15` · `AI2026`.
- 🧭 **4-step publish wizard** with live step tracking through the AI gate.
- 🖼 **Illustrated demo catalogue** — 9 extra listings with hand-built SVG artwork, generated by `static/images/demo/_build_demo_art.py`.
- ♿ **Accessibility & polish** — real alt attributes everywhere, `prefers-reduced-motion` respected, focus states, fully responsive down to mobile.

### 🔧 Correctness fixes

- **Module labels now match reality.** The base UI advertised *"CLIP zero-shot"* for categorization and *"ResNet-50 + Transformer"* for alt-text. The code actually runs **EfficientNet-B0** and **BLIP**. Labels corrected across the app.
- **Graceful degradation** — every AI panel handles an unreachable service instead of hanging on a spinner.
- **Parallel inference** on the publish path (`Promise.allSettled`) — 3 models, 1 spinner.
- **API base is now relative** (`/api`), so it works on any host/port instead of being hardcoded to `localhost:5001`.
- Renamed **SmartShop / Selvo → NeuraShop** across frontend, chatbot persona and health endpoint.

### 🙅 What was NOT touched

`alt_text/` · `sentiment/` · `recommendations/` · `categorization/` · `chatbot/` · `defect_detection/` — **every teammate's model code is untouched.** Same endpoints, same request bodies, same response shapes. The frontend is a drop-in replacement.

---

## 🚀 Quickstart

```bash
git clone https://github.com/Ghazouaniwalae/4ds-deep
cd 4ds-deep

python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env          # optional: chatbot config

python app.py
# → http://localhost:5001
```

First run downloads model weights from the HF hub (BLIP is ~1.5 GB) — grab a coffee. ☕

### 🔑 Enabling real Google Sign-In

1. Get an **OAuth 2.0 Web client ID** from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:5001` as an **Authorized JavaScript origin**.
3. Paste the ID into `GOOGLE_CLIENT_ID` near the top of the `<script>` block in `static/index.html`.

Leave it empty and the app runs demo sign-in instead — everything else works identically.

---

## 🧪 API reference

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `GET` | `/api/health` | — | `{status, platform}` |
| `GET` | `/api/products` | — | `{products[], count}` |
| `POST` | `/api/products` | `name, price, image_b64, …` | created product |
| `POST` | `/api/products/<id>/reviews` | `{review}` | `{success, total_reviews}` |
| `POST` | `/api/alt-text` | `image_b64` \| `image_path` | `{alt_text, confidence, word_count, wcag_compliant}` |
| `POST` | `/api/sentiment` | `{reviews[], product_id?}` | `{reviews[], aspect_summary, overall_label, overall_score}` |
| `GET` | `/api/similar/<id>` | — | `{similar[{id, name, price, score}]}` |
| `POST` | `/api/categorize` | `image_b64` \| `image_path` | `{category, confidence, top3[]}` |
| `POST` | `/api/chat` | `{message, history[], product?}` | `{reply, suggested_products[]}` |
| `POST` | `/api/check-image` | `image_b64` \| `image_path` | `{ok, quality_score, details, issues[], enhanced_image?}` |

```bash
# categorize (my module)
curl -X POST http://localhost:5001/api/categorize \
  -H "Content-Type: application/json" \
  -d '{"image_path":"static/images/prod_001.jpg"}'

# aspect-based sentiment
curl -X POST http://localhost:5001/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"reviews":["Great sound but the ear pads are too tight."]}'

# health
curl http://localhost:5001/api/health
```

---

## 📂 Project structure

```
neurashop/
├── app.py                     ← Flask entry point, blueprint registry
├── database.py                ← shared catalogue accessor
├── products.json              ← the data store
├── requirements.txt
│
├── alt_text/                  ← Obj 1 · BLIP captioning
├── sentiment/                 ← Obj 2 · ASE + ABSA cascade
├── recommendations/           ← Obj 3 · ResNet-50 + TF-IDF fusion
├── categorization/            ← Obj 4 · EfficientNet-B0  (Wala)
├── chatbot/                   ← Obj 5 · RAG + GPT-2
├── defect_detection/          ← Obj 6 · OpenCV + CNN enhancer
│
├── static/
│   ├── index.html             ← the NeuraShop SPA
│   ├── index.legacy.html      ← original team frontend (kept for diffing)
│   └── images/
│       └── demo/              ← generated SVG artwork + its build script
│
└── docs/screenshots/          ← README screenshots
```

---

## ⚠️ Known issue

On some Windows setups the PyTorch/NumPy **Intel MKL** runtime is broken and the process dies the moment a transformer runs inference:

```
INTEL MKL ERROR: The specified module could not be found. mkl_vml_def.1.dll.
```

That's an **environment problem, not a code problem**. Usual fix:

```bash
pip install --force-reinstall numpy
```

The frontend degrades gracefully either way — panels show "service unreachable" instead of hanging.

---

## 🙏 Acknowledgments

This is academic work, built as a **group project**, and it stays that way in the credits.

Original team repo → **https://github.com/Ghazouaniwalae/4ds-deep**

**s/o Bahaeddine Amara · s/o Amen Allah Ben Aissa · s/o Hassan Zorkot · s/o Ali Zouaoui · s/o Sarah Faleh** — the six modules exist because six people showed up. 🤝

Standing on the shoulders of: Salesforce **BLIP**, Google **EfficientNet**, Microsoft **ResNet**, **Sentence-Transformers**, OpenAI **GPT-2**, 🤗 **Hugging Face**, and **OpenCV**.

<div align="center">

**Built with 🧠 and too much coffee — Wala Eddine Ghazouani**

</div>
