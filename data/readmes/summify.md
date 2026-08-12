# MeetSummary — AI Meeting Summarizer for Microsoft Teams

> A JavaFX desktop client + Python AI backend that automatically detects new Microsoft Teams
> recordings, transcribes them, and turns them into readable summaries — so nobody has to
> re-watch a one-hour meeting to find one decision.

**Built during my end-of-studies internship at [Wevioo](https://www.wevioo.com/).**
Developed by **Walae Ghazouani** under the Scrum methodology across three sprints.
The full internship report (`Rapprt de stage.docx`) documents the analysis, UML design,
sprint backlogs and retrospectives behind this codebase.

---

## Table of Contents

- [The Business Case](#the-business-case)
- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [How the Pipeline Works](#how-the-pipeline-works)
- [Project Methodology](#project-methodology)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Acknowledgements](#acknowledgements)

---

## The Business Case

### The problem

Remote collaboration made Microsoft Teams the default meeting room for most organisations.
Teams records meetings well — but recordings are **write-only in practice**. They pile up in
OneDrive and are almost never replayed. Extracting the decisions, action items and technical
details out of a recording means sitting through it again, which nobody has time for.

The cost is real and compounding:

| Symptom | Business impact |
|---|---|
| Recordings archived but never re-watched | Knowledge captured, never retrieved |
| Manual note-taking during meetings | One attendee is half-present the whole call |
| Decisions trapped in audio | Slow diffusion to people who missed the meeting |
| No searchable meeting history | Same discussions repeated across sprints |

### Why not just use an existing tool?

The market already has Otter.ai, Fireflies.ai and similar SaaS products. The internship
analysis of the existing landscape found four recurring blockers for the target use case:

1. **Limited native Teams integration** — most require awkward bot-joins or manual uploads.
2. **Confidentiality** — recordings and transcripts land on third-party servers, outside the
   organisation's control. For consulting work under NDA, that is often a hard stop.
3. **Generic summaries** — one fixed output format that fits no one exactly.
4. **Per-seat subscription cost** — hard to justify for small teams.

### The proposition

MeetSummary is a **self-hosted, Teams-native** alternative:

- **Zero user effort.** No bot to invite, no upload step. A background listener polls OneDrive
  and picks up recordings as soon as Teams finishes writing them.
- **Data stays yours.** The transcription/summarisation backend and the MySQL database run on
  infrastructure you control. Nothing is stored on a vendor's servers.
- **Three summary formats, per user.** `Technical`, `Short` and `BulletPoints` are all generated
  for every meeting; each user picks the one their dashboard renders by default and can switch
  at any time without re-running the pipeline.
- **Passwordless.** Authentication is Microsoft OAuth 2.0 only — the app never sees, stores, or
  handles a password.
- **Attendee-aware.** Summaries and notifications are distributed to every attendee who has an
  account, not just the person who ran the recording.

### Who it is for

| User | Value |
|---|---|
| Team member who missed a meeting | Reads a 30-second summary instead of watching 60 minutes |
| Project manager | Follows several parallel workstreams from one dashboard |
| Engineer | Gets a `Technical` summary that keeps the details, not marketing prose |
| Organisation under NDA / GDPR constraints | Keeps recordings and transcripts fully in-house |

---

## What It Does

- **Sign in with Microsoft** — OAuth 2.0 via MSAL4J; account auto-provisioned on first login,
  profile refreshed on every subsequent login.
- **Auto-discover recordings** — a scheduled listener polls OneDrive every 10 seconds for new
  Teams recordings and pulls the meeting metadata (subject, times, organiser, attendees).
- **Auto-summarise** — a second scheduler picks up every `Pending` meeting once a minute and
  drives it through the Python pipeline: download → audio extraction → Whisper transcription →
  DeepSeek summarisation → PDF export.
- **Interactive dashboard** — searchable and filterable meeting list (by subject, date, event,
  attendee email), an embedded FullCalendar view, pagination, and status filters
  (All / Pending / Finished / Error).
- **Summary detail view** — full summary text, copy-to-clipboard, PDF download, attendee list
  with emails, and meeting timing.
- **Notifications** — persistent notification list plus in-app toasts on meeting detected,
  summary ready, and processing failure.
- **Recovery & control** — retry a failed summary, delete a meeting, switch summary type, or
  delete your account and all associated data.

---

## Architecture

The system is a **hybrid three-tier desktop application**. The Java client owns the user
experience and the system of record; the Python service owns the AI pipeline; they talk over a
single REST call.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION  (JavaFX)                            │
│                                                                           │
│   Login.fxml          Dashboard.fxml           Summary.fxml               │
│   LoginController     DashboardController      SummaryController          │
│                       + Calendar.html (FullCalendar in a WebView)         │
│                       ── Navigation / SceneManager / Session ──           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                       SERVICE / DOMAIN  (Java)                            │
│                                                                           │
│  MicrosoftLoginService   UserServices        MeetSerrvices                │
│  UserDataFetcher         SummaryServices     MeetingAttendeeService       │
│  MeetingDataFetcher      NotificationService CalanderFetcher              │
│  GraphFilesFetcher                                                        │
│                                                                           │
│  Background schedulers:                                                   │
│   • ReccordingListner.listen()   →  every 10s   (discover recordings)     │
│   • PythonCom.SummaryProcess()   →  every 60s   (drain Pending queue)     │
└──────┬──────────────────────┬──────────────────────────┬──────────────────┘
       │ JDBC                 │ HTTPS / Bearer           │ HTTP + JSON
       │                      │                          │
┌──────▼───────┐   ┌──────────▼────────────┐   ┌─────────▼───────────────────┐
│  MySQL       │   │  Microsoft identity   │   │  Python AI backend (Flask)  │
│  localdb     │   │  & Graph API          │   │  POST :5000/process         │
│              │   │                       │   │                             │
│  users       │   │  • OAuth 2.0 (MSAL)   │   │  1. download MP4 (OneDrive) │
│  meetings    │   │  • /me  (profile)     │   │  2. MP4 → WAV/MP3 + cleanup │
│  meeting_    │   │  • /me/drive (files)  │   │  3. Whisper → transcript    │
│   attendees  │   │  • /onlineMeetings    │   │  4. DeepSeek → 3 summaries  │
│  summaries   │   │  • /me/events         │   │  5. render 3 PDFs           │
│  notifications│  │                       │   │  → returns the 3 paths      │
└──────────────┘   └───────────────────────┘   └─────────────────────────────┘
```

### Layer responsibilities

| Layer | Package | Responsibility |
|---|---|---|
| Presentation | `Controllers` + `resources/*.fxml` | FXML views, event handling, rendering |
| Navigation | `Entities.Navigation`, `SceneManager` | Stage/scene lifecycle, screen transitions |
| Session | `Entities.Session` | Static holder for the authenticated `User` |
| Domain | `Entities` | `User`, `Meet`, `Summary`, `MeetingAttendee`, `Notification` + enums |
| Persistence | `Services.*Services` | JDBC access with prepared statements, one class per aggregate |
| Integration | `Services.*Fetcher`, `MicrosoftLoginService` | Microsoft identity + Graph API clients |
| AI bridge | `Entities.PythonCom` | REST client to the Flask backend, orchestrates the queue |

### Design decisions worth noting

- **Singleton `DBConnection`** — one JDBC connection shared process-wide; each service class
  prepares its statements once at construction.
- **Prepared statements everywhere** — every query is parameterised, so the data layer is not
  exposed to SQL injection.
- **Status as a state machine** — `SummaryStatus` (`Pending → Processing → Finished | Error`)
  is the coordination primitive between the two schedulers. The DB *is* the work queue; no
  broker is needed and the state survives a client restart.
- **Push-free integration** — both integrations are pull-based polling. Simpler than webhooks
  for a desktop client that has no public endpoint to receive callbacks on.
- **All three summary types generated once** — switching format is a read, not a re-run, so the
  toggle is instant and costs no extra API calls.
- **Fan-out notifications** — a meeting event produces one notification row per attendee that
  has an account, keyed on `meeting_attendees.user_id`.

---

## Technology Stack

### Client (this repository)

| Component | Choice | Version |
|---|---|---|
| Language | Java | 17 |
| UI framework | JavaFX (`controls`, `fxml`, `web`) | 17.0.2 |
| Build | Maven (+ shade plugin for a fat JAR) | — |
| Auth | MSAL4J (`com.microsoft.azure:msal4j`) | 1.13.x |
| HTTP | Apache HttpClient 5 + `java.net.http.HttpClient` | 5.2 |
| JSON | Gson + org.json | 2.10.1 / 20220320 |
| Database driver | MySQL Connector/J | 8.0.33 |
| PDF | Apache PDFBox | 2.0.30 |
| Tokens | `com.auth0:java-jwt` | 4.4.0 |
| Calendar widget | FullCalendar (bundled, rendered in a `WebView`) | — |

### Backend (separate service)

| Component | Choice |
|---|---|
| Language | Python |
| API framework | Flask (REST, `POST /process`) |
| Transcription | OpenAI Whisper (via Replicate API) |
| Summarisation | DeepSeek |
| Export | PDF generation, one file per summary type |

### External services

- **Microsoft Identity Platform** — OAuth 2.0 authorisation code flow.
- **Microsoft Graph API** — scopes requested: `User.Read`, `Files.Read.All`, `Calendars.Read`,
  `Mail.send`.

---

## Data Model

Five tables in the `localdb` MySQL schema:

```
users                       meetings                     summaries
─────                       ────────                     ─────────
id (PK)                     id (PK)                      id (PK)
microsoft_id  (unique)      microsoft_id  (unique)       meeting_id (FK → meetings)
name                        subject                      technical_path
email                       start_time                   short_path
createdat                   end_time                     bulletpoints_path
tenant_id                   duration                     created_at
summary_prefernce           audio_path
   ↑ SummaryType            summary_status  ← SummaryStatus
                            meeting_status  ← MeetStatus

meeting_attendees                     notifications
─────────────────                     ─────────────
id (PK)                               id (PK)
meeting_id (FK → meetings)            user_id (FK → users)
email                                 meet_id (FK → meetings)
name                                  type     ← NotificationType
user_id (FK → users, nullable)        content
                                      date
                                      status   ← NotificationStatus
```

`meeting_attendees.user_id` is nullable on purpose: an attendee is recorded by email even if
they have never signed into MeetSummary. It is back-filled by `linkUserToAttendee()` the first
time that person logs in, which retroactively gives them access to past meetings.

### Enumerations

| Enum | Values |
|---|---|
| `SummaryStatus` | `Pending`, `Processing`, `Finished`, `Error` |
| `SummaryType` | `Technical`, `Short`, `BulletPoints` |
| `MeetStatus` | `Opened`, `NotOpened` |
| `NotificationType` | `Meet`, `Success`, `Error` |
| `NotificationStatus` | `Viewed`, `NotViewed` |

---

## Project Structure

```
pfa3/
├── pom.xml                            Maven build (Java 17, JavaFX, shade)
├── launchmyapp.bat                    myapp:// protocol handler for the OAuth redirect
├── src/main/java/
│   ├── Controllers/
│   │   ├── LoginController.java       Microsoft sign-in, user provisioning, listener start
│   │   ├── DashboardController.java   Meeting list, search, calendar, notifications, filters
│   │   └── SummaryController.java     Summary detail view, copy, PDF download
│   ├── Entities/
│   │   ├── User / Meet / Summary / MeetingAttendee / Notification
│   │   ├── SummaryStatus / SummaryType / MeetStatus / NotificationType / NotificationStatus
│   │   ├── DBConnection.java          Singleton JDBC connection
│   │   ├── Session.java               Current authenticated user
│   │   ├── Navigation.java            Scene routing
│   │   ├── CalendarBridge.java        Java ↔ JavaScript bridge for the WebView calendar
│   │   └── PythonCom.java             Flask REST client + summary queue scheduler
│   ├── Services/
│   │   ├── MicrosoftLoginService.java MSAL4J OAuth, local redirect server on :54000
│   │   ├── UserDataFetcher.java       Graph /me → User
│   │   ├── MeetingDataFetcher.java    Graph /onlineMeetings → Meet + attendees
│   │   ├── GraphFilesFetcher.java     Graph /me/drive → recording files
│   │   ├── CalanderFetcher.java       Graph /me/events → calendar entries
│   │   ├── ReccordingListner.java     10-second OneDrive polling loop
│   │   ├── UserServices.java          users CRUD
│   │   ├── MeetSerrvices.java         meetings CRUD + Pending queue query
│   │   ├── MeetingAttendeeService.java meeting_attendees CRUD + user linking
│   │   ├── SummaryServices.java       summaries CRUD
│   │   └── NotificationService.java   notifications CRUD
│   └── Test/main.java                 JavaFX Application entry point
└── src/main/resources/
    ├── Login.fxml, Dashboard.fxml, Summary.fxml
    ├── styles.css, summary-style.css
    ├── Calendar.html + FullCalendar/          Embedded calendar widget
    └── Json/                                  Mock fixtures for offline development
```

---

## Getting Started

### Prerequisites

- JDK 17+
- Maven 3.8+
- MySQL 8 with a schema named `localdb`
- Python 3.9+ for the summarisation backend (separate repository/service)
- An Azure AD app registration with a public-client redirect URI of `http://localhost:54000`

### 1. Configuration & database

Copy `.env.example` to `.env` and fill it in — see [Configuration](#configuration) for the full
list of variables.

Create the `localdb` schema and the five tables described in [Data Model](#data-model), then set
`DB_URL`, `DB_USER` and `DB_PASSWORD` in your `.env`.

### 2. Azure AD registration

Register a **public client** application in the Azure portal, add
`http://localhost:54000` as a redirect URI, and grant the delegated permissions `User.Read`,
`Files.Read.All`, `Calendars.Read` and `Mail.send`. Set the resulting client ID as
`AZURE_CLIENT_ID` in your `.env`.

### 3. Backend

Start the Flask summarisation service so that `POST http://localhost:5000/process` accepts:

```json
{
  "access_token": "...",
  "url":          "https://.../recording.mp4",
  "subject":      "Sprint review",
  "meetid":       42,
  "summaryType":  "Technical"
}
```

and responds with:

```json
{
  "technical_path":    "/abs/path/technical.pdf",
  "short_path":        "/abs/path/short.pdf",
  "bulletpoints_path": "/abs/path/bullets.pdf"
}
```

An `{"error": "..."}` response marks the meeting `Error` and surfaces a Retry button in the UI.

### 4. Run

```bash
mvn clean javafx:run
```

Or build a self-contained JAR:

```bash
mvn clean package
```

`launchmyapp.bat` registers the `myapp://` protocol so the browser can hand the OAuth redirect
back to the desktop app after sign-in.

---

## Configuration

No secret or endpoint is hardcoded. `Entities/Config.java` resolves every setting in this order:

1. environment variable
2. entry in a `.env` file at the project root (gitignored)
3. built-in default

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DB_URL` | no | `jdbc:mysql://127.0.0.1:3306/localdb` | MySQL JDBC URL |
| `DB_USER` | no | `root` | MySQL user |
| `DB_PASSWORD` | **yes** | — | MySQL password; startup fails fast if unset |
| `AZURE_CLIENT_ID` | **yes** | — | Azure AD public-client application ID |
| `AZURE_AUTHORITY` | no | `https://login.microsoftonline.com/common/oauth2` | Identity authority |
| `AZURE_REDIRECT_URL` | no | `http://localhost:54000` | OAuth redirect URI |
| `AZURE_REDIRECT_PORT` | no | `54000` | Port of the local redirect listener |
| `BACKEND_URL` | no | `http://localhost:5000` | Flask backend base URL (`/process` is appended) |
| `MOCK_SERVER_URL` | no | `http://localhost:5005` | Mock server base URL |
| `RECORDINGS_URL` | no | mock server | Recording discovery endpoint |
| `MEETING_BASE_URL` | no | mock server | Meeting metadata endpoint (id is appended) |
| `RECORDINGS_POLL_SECONDS` | no | `10` | Discovery poll interval |
| `SUMMARY_POLL_MINUTES` | no | `1` | Summary queue poll interval |

`DB_PASSWORD` and `AZURE_CLIENT_ID` use `Config.require()` — the app refuses to start with a
clear error rather than failing obscurely later.

### Mock mode

By default the app reads recordings and meeting metadata from a local mock server on
`http://localhost:5005` (`/mock/onedrive/recordings` and `/mock/graph/meeting/{id}`) so the
pipeline can be developed and demoed without live Teams recordings. Switching to live Microsoft
Graph is a configuration change, not a code change — set:

```
RECORDINGS_URL=https://graph.microsoft.com/v1.0/me/drive/root/search(q='Recording')
MEETING_BASE_URL=https://graph.microsoft.com/v1.0/users/{userId}/onlineMeetings/
```

The live meeting-metadata call also needs the `Authorization: Bearer` header in
`MeetingDataFetcher` re-enabled — it is commented out for mock mode.

---

## How the Pipeline Works

### Discovery loop — every 10 seconds

```
ReccordingListner.listen()
  └─ GET  OneDrive recordings  (Bearer token)
     └─ for each file:
        ├─ meetSerrvices.checkMeet(microsoft_id)   already known? → skip
        ├─ MeetingDataFetcher.fetchData(id)        subject, times, organiser, attendees
        ├─ meet.setAudioUrl(webUrl)
        ├─ meetSerrvices.insertMeet(meet)          → status = Pending
        └─ one Notification(type = Meet) per attendee
```

### Summarisation loop — every 60 seconds

```
PythonCom.SummaryProcess()
  └─ ms.selectPendingMeets()
     └─ for each meeting:
        ├─ status → Processing                     (claims the item)
        ├─ POST :5000/process {token, url, subject, meetid, summaryType}
        │    backend: download → audio → Whisper → DeepSeek ×3 → PDF ×3
        ├─ on success:
        │    ├─ SummaryServices.insertSummary(technical, short, bulletpoints)
        │    ├─ status → Finished
        │    └─ Notification(type = Success) per attendee
        └─ on error / exception:
             ├─ status → Error
             └─ Notification(type = Error) per attendee   → Retry button in the UI
```

The long HTTP timeout on this call is deliberate: transcription and summarisation of a long
recording are slow synchronous operations, and the scheduler is single-threaded so items are
drained one at a time rather than flooding the AI APIs.

---

## Project Methodology

Delivered with **Scrum** over three sprints. Being a solo internship project, all three Scrum
roles (Product Owner, Scrum Master, Development Team) were held by the same person, but the
ceremonies — backlog grooming, sprint planning, review and retrospective — were run for real.

| Sprint | Theme | Delivered |
|---|---|---|
| **1** | Authentication & user management | Microsoft OAuth login, token handling, auto-provisioning and profile refresh, post-login routing |
| **2** | Dashboard, meetings & summaries | Graph integration, OneDrive recording linkage, dashboard with search/calendar/filters/pagination, detail view, notifications, retry, delete, summary-type switching |
| **3** | Python AI backend | Automated download, MP4→audio conversion, Whisper transcription, DeepSeek summarisation in 3 formats, PDF export, Flask REST bridge to the Java client |

The product backlog held 18 user stories totalling roughly 211 hours of estimated effort,
prioritised `Critique` / `Élevée`. UML modelling (use case, class, sequence and state diagrams)
was done in draw.io ahead of each sprint's implementation. Development in IntelliJ IDEA (Java)
and VS Code (Python), with Postman for API testing and Git for version control.

---

## Known Limitations

Honest inventory of the current state:

- **The old database password is still in the git history.** Credentials are now read from the
  environment, but the value that used to be hardcoded in `DBConnection.java` remains in earlier
  commits. It should be rotated in MySQL.
- **Mock endpoints are the default.** Recording discovery and meeting metadata read from the
  local mock server on port 5005 unless `RECORDINGS_URL` and `MEETING_BASE_URL` are set.
- **Single shared JDBC connection.** Fine for a single-user desktop client, but it is a
  bottleneck and a single point of failure under concurrency.
- **No token refresh.** The access token is held for the lifetime of the session; a long-running
  session will eventually hit an expired token and need a re-login.
- **The Python backend is a separate service** and is not versioned in this repository.
- **Desktop-only, local-only.** No cloud deployment, no multi-tenant hosting.

---

## Roadmap

- Cloud deployment of the Python backend for scalability and high availability.
- Connection pooling (HikariCP) and token refresh handling.
- Parallel processing of the summary queue to cut end-to-end latency.
- Additional export formats — Word alongside PDF — plus summary sharing.
- Integration with project-management tools so action items flow straight into a tracker.
- Meeting analytics: time spent in meetings, recurring topics, participation trends.

---

## Acknowledgements

This project was designed and built during my internship at **Wevioo**, a digital
transformation consultancy founded in 1998 that has delivered projects in more than 30 countries
across Europe, North America, Africa and the Middle East, working in supply chain, industry,
finance, technology and the public sector.

Thank you to the Wevioo team for the supervision, the technical guidance and the trust to own an
end-to-end project — from problem analysis and UML design through to a working hybrid
Java/Python application. The internship was where I learned to build hybrid desktop
applications, integrate third-party APIs seriously, and run a project with Scrum discipline
rather than just reading about it.

**Author:** Walae Ghazouani
**Host company:** Wevioo
**Keywords:** JavaFX · Python · Flask · Microsoft Graph · Whisper · DeepSeek · MySQL · Scrum
