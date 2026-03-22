# Scholarly Notes — Concept Document

> A unified workspace for academics to write, discover sources, evaluate credibility, compute, and draft—without constantly switching tools.

---

## Table of Contents

- [Vision](#vision) — What Scholarly Notes is and who it's for
- [Features](#features) — Core features in 5 areas
- [User Workflow](#user-workflow-summary) — How everything connects
- [Design Principles](#design-principles) — Guiding design choices
- [Technical Notes](#potential-technical-considerations) — APIs, platform, storage (conceptual)
- [Implementation](#step-by-step-implementation-procedure) — 3-part step-by-step build plan
- [24-Hour MVP Plan](#24-hour-mvp-plan-parallel) — Desktop app in 24 hours, 3 people working simultaneously
- [Summary](#summary) — Quick recap

---

## Vision

**Scholarly Notes** is a software application for academics and researchers that combines:

- **Freewriting** — Think and develop ideas in connected notes (Obsidian/Notion-style)
- **Literature discovery** — Find and manage sources alongside your writing
- **Credibility assessment** — See bias and reliability of recommended sources
- **Computational tools** — Math, graphs, and physical models via Wolfram Alpha
- **AI writing help** — LLM-suggested next paragraphs when you're stuck

The app sits at the intersection of flexible note-taking (Obsidian, Notion) and research tools (reference management, discovery), with added layers for credibility, computation, and AI drafting.

---

## Features

### 1. Core Writing Experience

**Obsidian/Notion-like freewriting**

- **Block-based or markdown-first editing** — Notes can be linked, nested, and organized however you choose
- **Graph or canvas views** — See how ideas connect
- **Tags, folders, and databases** — Organize by project, topic, or research question
- **Templates** — Literature notes, research logs, outlines
- **Distraction-free mode** — Full-screen, minimal UI
- **Version history** — Restore previous drafts
- **Cross-platform sync** — Local-first, optional cloud

*Audience:* Academics who think in connected notes and want a space to develop ideas before formal manuscripts.

---

### 2. Literature Discovery Sidebar

**Google Scholar integration**

- **Sidebar tab** — Collapsible panel with recommended articles
- **Context-aware suggestions** — Based on current note, selected text, tags, or keywords
- **Search in sidebar** — By title, author, keyword
- **Rich results** — Title, authors, year, abstract, citation count, PDF link
- **One-click save** — Add to reference library, link to notes, insert citations
- **Export** — BibTeX, RIS for LaTeX and reference managers

*Goal:* Keep discovery close to writing, not separate "literature search" sessions.

---

### 3. Bias and Credibility Assessment

**Measuring source quality**

- **Credibility score** — Per article: journal reputation, citations, retraction status, funding
- **Bias indicators** — Publisher type, predatory flags, conflicts of interest
- **Transparent methodology** — Explain how scores are derived ("based on retraction database + journal rank")
- **User overrides** — Flag sources as trusted or low trust
- **Warnings** — Alerts for retracted papers or predatory journals

*Goal:* Help researchers quickly distinguish reliable from questionable sources.

---

### 4. Wolfram Alpha Integration

**On-demand computation**

- **Natural-language queries** — "integrate x^2 from 0 to 1" → answer and graph
- **Graphs and plots** — Functions, data distributions, time series
- **Fluid and physical models** — Dynamics, differential equations, simulations
- **Math notation** — LaTeX inline and blocks; solve/simplify via Wolfram
- **Unit conversions** — Quick conversions and dimensional analysis
- **Insert into note** — Embed answers, graphs, or LaTeX

*Goal:* STEM researchers get math, physics, and viz without leaving the app.

---

### 5. AI Writing Assistance

**LLM-powered paragraph suggestions**

- **"Suggest next paragraph" button** — Proposes text based on current content and style
- **Insert / edit / discard** — Accept as-is, tweak, or reject
- **Tone controls** — Academic, technical, plain language
- **Optional citation awareness** — Stick to cited sources; flag when citation needed
- **Drafting modes** — Outline expansion, conclusion, transitions
- **Privacy** — Clear policy on cloud vs. local; support for local models

*Goal:* Help writers unstuck and get draftable text to revise instead of blank pages.

---

## User Workflow Summary

1. **Create a note** — Start a new research note or open a project
2. **Write freely** — Use blocks, links, and tags
3. **Use the sidebar** — Open Literature tab for recommendations or search
4. **Assess sources** — Check credibility and bias before adding
5. **Add references** — Save, link to notes, insert citations
6. **Use Wolfram when needed** — Compute, plot, or embed math
7. **Get AI help** — Use "Suggest next paragraph" when stuck
8. **Organize and export** — Structure for manuscripts; export references (LaTeX, Word)

---

## Design Principles

- **Writing-first** — Editor is core; other features support it
- **Transparency** — Scores and AI suggestions are explainable and controllable
- **Optional depth** — Advanced features available but not forced
- **Privacy-aware** — Local storage, minimal sharing, user control
- **Extensibility** — Plug-in-ready for new sources and tools

---

## Potential Technical Considerations

- **APIs** — Google Scholar (scraping/unofficial), Wolfram Alpha, LLM APIs
- **Reference data** — Retraction databases, journal rankings, predatory lists
- **Offline** — Cache notes and references; sync when online
- **Platform** — Desktop-first (Electron/Tauri); optional web companion
- **Storage** — Local-first; optional sync to user-owned storage (cloud, Git)

---

## Step-by-Step Implementation Procedure

Implementation is split into **3 parts** for parallel work by teammates.

### Overview

- **Part 1** — Teammate A: Foundation & core writing environment
- **Part 2** — Teammate B: Literature discovery & credibility
- **Part 3** — Teammate C: Wolfram Alpha & AI writing assistance

**Dependency:** Part 1 first (shell + editor). Parts 2 and 3 can run in parallel once Part 1 is ready.

---

### Part 1: Foundation & Core Writing Environment  
*Owner: Teammate A*

**Goal:** App shell, editor, storage, and sidebar placeholders.

- **1.1** — Project setup (Electron/Tauri + React/Vue/Svelte), build pipeline → `npm install` + dev script works
- **1.2** — Storage for notes (JSON, SQLite, IndexedDB) with CRUD → Notes persist across sessions
- **1.3** — Block-based editor (TipTap, Lexical, Slate, etc.) with basic formatting → Editor saves to storage
- **1.4** — ~~Links `[[note name]]` and backlinks~~ (removed)
- **1.5** — Tags and folders → Notes organizable
- **1.6** — Layout: editor + collapsible sidebar with tab placeholders → Shell ready for Parts 2 & 3
- **1.7** — Templates (literature note, research log) → 2–3 templates usable
- **1.8** — Version history with restore → Past versions viewable/restorable
- **1.9** — Distraction-free mode → Full-screen toggle
- **1.10** — **Handoff** — Document editor API, storage schema, extension points → ARCHITECTURE doc for team

---

### Part 2: Literature Discovery & Credibility  
*Owner: Teammate B*

**Goal:** Google Scholar sidebar + credibility scoring.

*Prerequisite:* Part 1 layout and sidebars ready.

- **2.1** — Google Scholar fetching (rate limit, cache) → Search results for query
- **2.2** — Literature tab UI (search, results list) → Sidebar tab with Scholar data
- **2.3** — Context-aware recommendations (keywords from note/text) → "Recommended for this note"
- **2.4** — Reference library (save, link to notes) → Articles saved and linked
- **2.5** — Credibility sources (retraction DB, journal rankings, predatory lists) → Score/badge per article
- **2.6** — Display scores + methodology tooltips → Users see "why" on hover
- **2.7** — User overrides (trusted/untrusted) → User can override scores
- **2.8** — Citation insertion (APA, Chicago, BibTeX) at cursor → One-click insert
- **2.9** — Export (BibTeX, RIS, CSV) → Export from library
- **2.10** — **Handoff** — Document reference schema, credibility API → API doc for Part 3

---

### Part 3: Computational Tools & AI  
*Owner: Teammate C*

**Goal:** Wolfram Alpha + LLM "Suggest next paragraph."

*Prerequisites:* Part 1 done; Part 2 reference schema available.

- **3.1** — Wolfram Alpha API service layer → Query → structured result
- **3.2** — Tools/Compute sidebar tab (query input) → UI for queries
- **3.3** — Render results (text, images, LaTeX); "insert into note" → User embeds graphs/math
- **3.4** — LaTeX in editor (KaTeX, MathJax) → Rendered math in notes
- **3.5** — Shortcuts for unit conversion, integral, plot 2D/3D → Quick-access buttons
- **3.6** — Fluid/physical model examples or links → Help panel for models
- **3.7** — LLM service ("suggest next paragraph" with context) → API returns suggestion
- **3.8** — Button in toolbar + preview panel → User requests and sees suggestion
- **3.9** — Insert / edit / discard + tone controls → Accept, modify, or reject
- **3.10** — *(Optional)* Citation awareness (pass references to LLM) → Suggestions grounded in sources
- **3.11** — **Integration** — Full workflow test, fix cross-part bugs → End-to-end demo ready

---

### Coordination

- **Kickoff** — Agree on stack, schemas, sidebar design (All)
- **Part 1 done** — Review layout; Parts 2 & 3 start (All)
- **Ongoing** — Weekly sync on APIs and shared types (All)
- **Final** — Merge, test, fix, document (All)

---

### Dependency Diagram

```
Part 1 (Foundation) ──► Part 2 (Literature) ──┐
        │                      │                │
        └────────────► Part 3 (Tools & AI) ────┴──► Final integration
```

- Part 1 must be done first (at least 1.1–1.6)
- Parts 2 and 3 can run in parallel
- Part 3 may use Part 2 references for citation-aware LLM

---

## 24-Hour MVP Plan (Parallel)

**Stack:** Electron + Vite + React + TypeScript  
**Scope:** Desktop app MVP in 24 hours with 3 people working simultaneously.

### Hour 0 — Everyone Together (30–45 min)

- Scaffold: `npm create @electron-vite/app scholarly-notes -- --template react-ts`
- Add Tailwind (or chosen styling)
- Create shared folder structure:
  - `src/components/Editor/` — Person A
  - `src/components/Sidebar/` — Person A (shell)
  - `src/components/LiteratureTab/` — Person B
  - `src/components/ToolsTab/` — Person C
  - `src/types.ts` — Shared by all
- Add `src/types.ts` with `Note` and `Reference` interfaces
- Confirm `npm run dev` works
- Commit and push; each person branches

### Person A: Shell + Editor

- **1–3h** — Layout: editor area + sidebar with placeholder tabs
- **3–5h** — Editor (TipTap or similar), basic formatting, content state
- **5–7h** — Storage: save/load notes (JSON or localStorage)
- **7–9h** — Note list + switching between notes
- **9–11h** — Import Person B's `LiteratureTab` and Person C's `ToolsTab` into sidebar
- **11–12h** — Wire shared state (Zustand/Context), fix integration

### Person B: Literature Tab

- **1–2h** — Build `LiteratureTab` as standalone component (props: `onAddReference`)
- **2–4h** — Search UI + mock results
- **4–6h** — Real Scholar search (SerpAPI or scraping)
- **6–8h** — "Add to references" → store or callback
- **8–10h** — Credibility badges (hardcoded "High"/"Medium" for demo)
- **10–12h** — Integration: plug into Person A's sidebar

### Person C: LLM + Tools Tab

- **1–2h** — LLM service: `suggestNextParagraph(content: string)` → API function
- **2–4h** — "Suggest next paragraph" button + preview panel (standalone)
- **4–6h** — Insert / Discard into editor (needs `content` + `onInsert` from Person A)
- **6–8h** — Build `ToolsTab` (placeholder + Wolfram link)
- **8–10h** — Polish: loading states, error handling
- **10–12h** — Integration: connect to Person A's editor

### Shared Contract (everyone must follow)

- **State:** Zustand store with `notes`, `currentNoteId`, `references`, `editorContent`
- **Editor API:** `getEditorContent()` and `insertTextAtEnd(text: string)` (or equivalent)
- **Integration point:** Hour 9–10 — Person A imports B and C's components; B and C consume A's store
- **Branches:** `person-a`, `person-b`, `person-c` → merge into `main` around hour 10

### Sync Points

- **0h** — Kickoff + scaffold + types
- **3h** — Quick check: layouts / components running separately
- **6h** — Sync: check APIs and data flow
- **9h** — Integration sprint: merge and wire components
- **11h** — End-to-end test, fix critical bugs
- **12h** — Build installers, rehearse demo

### Dependency Diagram (parallel)

```
Hour 0: [A, B, C] together — scaffold + types
        │
        ├── A: Shell + Editor ──────────────┐
        ├── B: LiteratureTab (standalone) ──┼── Hour 9–10: Merge
        └── C: LLM + ToolsTab (standalone) ─┘
```

### Integration Rules (Hour 9+)

- Person A merges B and C into their branch (or everyone merges to `main`)
- Person A imports `<LiteratureTab />` and `<ToolsTab />` into sidebar
- Person C gets `content` and `onInsert` from Person A's editor via store/props
- Person B writes to shared store for `references`

### Fallback if Integration Breaks

- Person B and C's components work in isolation — use tabs to switch between "views" and demo each separately
- Demo the three pieces even if not fully wired
- Working parts beat perfect integration for a 24h deadline

---

## Summary

**Scholarly Notes** is a research-oriented writing app that combines:

1. **Flexible freewriting** (Obsidian/Notion-style)
2. **Google Scholar recommendations** in a sidebar
3. **Bias and credibility assessment** of sources
4. **Wolfram Alpha** for math, graphs, and physical models
5. **LLM-assisted drafting** via "suggest next paragraph"

All in one workspace—with transparency and user control over external services and AI.
