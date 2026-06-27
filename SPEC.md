# AI Radar — Build Spec

> **Tagline:** "Turn AI news into things you can actually use."
> **One-liner:** A reels-style AI learning platform that turns daily AI advancements into short explainers, searchable tutorials, perks, prompt packs, and mini proof-of-work projects — for students, early builders, and creators.

This is the working spec for the hackathon build. It is written to be executed against directly (by a human or an AI coding agent in Cursor). **Read the "Judging Strategy" section first — it changes how everything below should be built.**

---

## 0. Judging Strategy (read this first)

The MVP is scored on this rubric. Build decisions should be made to maximize points here, not just to match a feature list.

| Criterion                                 | Weight  | What it's really asking                                                                                                                                  |
| ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Innovation & creative use of sponsor tech | **30%** | Is the idea fresh (not a known concept repainted)? Is a sponsor tool (OpenAI/Codex, Exa, Cursor, Zo) used in a _central, inventive_ way — not bolted on? |
| Proof of Work – Functionality             | **25%** | Does it actually work? Did we ship a real, demonstrable build?                                                                                           |
| Problem fit & Market Value                | **25%** | Real problem, real user? Commercially viable / adoptable at scale?                                                                                       |
| Design, Craft & Taste                     | **20%** | Purposeful, tasteful, intuitive, well-considered UX?                                                                                                     |

### The core decision: sponsor tools are the engine, mock data is the fallback

A polished app full of hardcoded mock cards uses **zero** sponsor tools and reads as "AI newsletter with a coat of paint" — the exact thing the 30% Innovation criterion penalizes. The fix is the highest-leverage move in this build:

- **The Hype Filter** (Hype / Useful / Student Relevance scores) is the product's self-described core feature. It is only _defensible_ if those scores are computed by an LLM over **real, fresh** AI news pulled live. Faked scores undercut the entire "practical over hype" thesis.
- Doing this wins **Innovation (30%) + Proof of Work (25%) + Problem Fit (25%)** simultaneously.

**Minimum to be competitive on the 30%: Exa + OpenAI running live, for real.** Mock data stays as a network-failure fallback so a flaky connection can't kill the demo.

### Sponsor integration map

| Sponsor                             | Role                    | How it's _central_ (not bolted on)                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exa**                             | Retrieval engine        | Neural search API with a live **news vertical**, real-time crawling, token-efficient highlights, and **Monitors** (scheduled recurring searches that dedupe and return only new content — literally "the daily radar"). Powers (a) the Radar feed with real AI news, (b) the entire Search page via semantic search, (c) "Ask Radar." |
| **OpenAI / Codex**                  | Transformation layer    | Turns a raw Exa result into the 3 scores, "why it matters," the tutorial, the prompt pack, the mini-project, and the LinkedIn/README exports. Every "structured content" field is _generated_, not authored.                                                                                                                          |
| **Zo** _(stretch / differentiator)_ | Always-on backend       | Personal AI cloud computer with scheduled tasks that can text/email you. Host the daily refresh job: every morning it runs the Exa→OpenAI pipeline and pings the user the day's radar. Demos beautifully ("it updated itself overnight").                                                                                             |
| **Cursor**                          | Build tool (honest use) | Build the app in Cursor; say so. Optional stretch: the Build page "Start Project" exports a scaffold/README to open in Cursor. Don't force it.                                                                                                                                                                                        |

### Build order (max rubric points per hour)

1. **Three-tab shell + Radar feed + Hype Filter UI** with mock data, running end-to-end → protects the 25% Proof-of-Work floor.
2. **Wire Exa** into Search and the feed (real news) → the 30% unlock.
3. **Wire OpenAI** to generate scores + "why it matters" + one tutorial live.
4. **Build page** Save → start project → mark complete → export flow → closes the demo flow.
5. **Polish** (animations, glassmorphism, empty states) → the 20% Design bucket.
6. **Zo** scheduled job + "Ask Radar" if time remains → the differentiator.

---

## 1. Tech Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui-style components
- **Icons:** Lucide
- **Animation:** Framer Motion (subtle)
- **User state** (saves, progress, streak): `localStorage`
- **Content** (live AI news + generated fields): Next.js route handlers (server-side) holding API keys; **optional** Neon (Postgres) to cache the daily feed so Exa isn't hit on every load
- **AI:** Exa (retrieval) + OpenAI (generation), with a **mock-data fallback** module for offline/demo safety
- **No login** for MVP — app works immediately on open

### Resolved spec contradictions

1. **NeonDB vs localStorage:** Use `localStorage` for _user_ state; use a server route (+ optional Neon cache) for _content_. Never put API keys in the client.
2. **"Practical over hype" vs all-mock-data:** Scores must be LLM-computed over real news for the thesis to hold. Mock = fallback only.

---

## 2. App Structure

Three tabs via a fixed bottom navigation bar:

1. **Radar** — discovery feed (home page)
2. **Search** — search & filter AI tools/updates/tutorials/perks
3. **Build** — turn saved updates into tutorials, mini projects, and proof-of-work outputs

App container: max width ~430px, centered on desktop to mimic a mobile app. Bottom nav fixed. Cards scroll-friendly.

---

## 3. Page Requirements

`[MUST]` = load-bearing for acceptance criteria / demo flow. `[NICE]` = build if time remains.

### 3.1 Radar (home)

- `[MUST]` Header: "Today's AI Radar" greeting + date + subheading ("Fresh AI updates turned into tutorials, prompts, and mini projects."); notification/bell icon
- `[MUST]` Filter chips: All, Student, Coding, Design, Business, Free Tools, Portfolio — clicking updates the feed
- `[MUST]` "Today's Pick" featured card (larger styling)
- `[MUST]` Vertical reels-style feed of **Radar cards**, each containing:
    - Category badge (New Model, AI Tool, Research, Open Source, Productivity, Design, Coding, Business, Video AI, Student Tool)
    - Headline + one-sentence summary
    - Tags
    - **Hype Filter** (3 scores)
    - "Why it matters" (plain language)
    - Perks — practical (saves time, good for portfolio, useful for coding…) + access (free tier, student discount, open-source, trial credits, API, no-code, waitlist, paid only)
    - 5 action buttons: **Try Tutorial**, **Save**, **Prompt Pack**, **Mini Project**, **Share**
- `[MUST]` Card style: glassmorphism, rounded corners, subtle border, icons, enter animation
- Intro/empty copy: "Stop doomscrolling AI news. Start building with it."

### 3.2 Search

- `[MUST]` Title "Search AI Radar" + subtitle ("Find AI tools, updates, tutorials, prompts, and student-friendly perks.")
- `[MUST]` Large search input + popular-search chips (Free AI tools, AI for presentations, AI for coding, AI for design, AI for business, AI video tools, Student discounts, Prompt packs, Portfolio projects, This week in AI)
- `[MUST]` **Real-time** search matching: title, summary, category, tags, tool name, perks, tutorial title, prompt-pack content, use cases
- `[MUST]` Result cards (compact): name, category, short summary, best-for, free/paid/OSS status, difficulty, student-relevance score; buttons: View Details, Tutorial, Save, Compare
- `[MUST]` Empty state: "No matching AI updates found. Try searching for 'presentation', 'coding', 'video', or 'free tools'."
- `[NICE]` Filter controls: category, difficulty, free/paid, student relevance, has-tutorial, has-prompt-pack, has-mini-project
- `[NICE]` **Compare** (select 2+ → table/modal): name, best for, free tier, difficulty, student relevance, main perk, limitation, suggested use case

> When live: Search is powered by **Exa semantic search**, not array filtering. This is a primary 30% lever.

### 3.3 Build

- `[MUST]` Title "Build" + subtitle ("Turn AI updates into proof of work." / "Your saved tutorials and mini projects live here.")
- `[MUST]` **Saved Tutorials** — items saved from Radar/Search; card: title, category, difficulty, est. time, progress status, Continue
- `[MUST]` **Mini Projects** — cards: title, difficulty, est. time, tools needed, skills learned, portfolio value, steps, output; buttons: Start Project, Mark Complete
- `[MUST]` **Portfolio Progress Tracker** — projects completed, tutorials completed, prompts copied, saved tools, streak/weekly progress; progress bars + badges
- `[MUST]` **Export Actions** — generate from templates: LinkedIn post, GitHub README (minimum)
- `[NICE]` Export: portfolio project description, reflection summary
- `[NICE]` **Weekly Challenge** featured card (why it matters, steps, tools, deliverable, portfolio value)
- Intro copy: "Every AI update becomes something you can try, build, and show."

Example mini projects: 5-slide AI pitch deck · 10-sec AI product ad · no-code chatbot · resume-analyser prompt workflow · AI brand-campaign concept · paper-to-slides summary · AI job-application tracker.

---

## 4. Cross-Cutting Features

### 4.1 Hype Filter `[MUST]`

3 scores as bars/pills with explanations:

- **Hype Score /10** — how much buzz it's getting
- **Actually Useful Score /10** — how practical it is right now
- **Student Relevance Score /10** — how useful for students/builders

Conditional messages:

- High hype + low useful → "High hype, but limited practical use for most students right now."
- High student relevance → "Worth trying for your next project."

> Live: scores are LLM-computed over the real news item.

### 4.2 Quick Tutorial `[MUST]`

Tutorial object: title, goal, estimated time, difficulty, tools needed, step-by-step guide, copyable prompt, expected output, common mistakes, next step. **Copy Prompt** button → toast "Prompt copied!"

### 4.3 Prompt Pack `[MUST]`

Six copyable prompts per item: student, coding, marketing, design, research, career. Copy → toast.

### 4.4 Perks Tracker `[MUST]`

Eight access flags as badges: free tier, student discount (Yes/No/Unknown), open source, trial credits, API available, no-code friendly, requires waitlist, paid only. Plus a **limitations** list (watermark, limited credits, region locks, needs setup, requires API key, expensive at scale, may hallucinate, inconsistent output).

### 4.5 Ask Radar `[NICE — but this is where Exa+OpenAI should live]`

Floating button (or in Search). User asks e.g. "What AI tools help with presentations?", "What should I try today as a business student?", "Give me a mini project using AI video." Answers from the dataset; when live, this is Exa retrieval + LLM synthesis.

---

## 5. Interactions (all 10 MUST work — no dead buttons)

1. **Save** → item appears in Build › Saved Tutorials; persists in `localStorage`; toast "Saved to Build"
2. **Copy prompt** → clipboard; toast "Prompt copied"
3. **Start mini project** → appears in Build; status "In Progress"
4. **Mark complete** → status "Completed"; portfolio progress updates
5. **Search** → results update in real time across all searchable fields
6. **Filter chips** → feed/search updates
7. **View details** → modal/drawer with full explanation, tutorial, prompt pack, perks, limitations, mini project
8. **Compare** → comparison modal/table for 2+ selected items
9. **Generate LinkedIn post** → from a completed project, via template
10. **Generate GitHub README** → README content via template

> Hard rule: every visible button performs an action, opens a modal, copies text, saves content, or shows a useful message.

---

## 6. Components

`AppShell` · `BottomNav` · `RadarCard` · `HypeScore` · `PerkBadges` · `TutorialModal` · `PromptPackModal` · `MiniProjectCard` · `SearchBar` · `FilterChips` · `SearchResultCard` · `CompareModal` · `BuildProgress` · `SavedTutorialCard` · `ExportModal` · `Toast`

---

## 7. Data Model

≥12 items across these categories: AI video · presentations · coding assistant · research summariser · image generation · voice · workflow automation · job/resume · open-source LLMs · agents · design · business/marketing.

```ts
interface AIUpdate {
    id: string;
    title: string;
    toolName: string;
    category: string;
    summary: string;
    longExplanation: string;
    whyItMatters: string;
    tags: string[];
    date: string; // ISO, e.g. "2026-06-27"
    hypeScore: number; // 0–10  (LLM-computed when live)
    usefulScore: number; // 0–10
    studentRelevanceScore: number; // 0–10
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    bestFor: string[];
    access: {
        freeTier: boolean;
        studentDiscount: "Yes" | "No" | "Unknown";
        openSource: boolean;
        trialCredits: "Yes" | "No" | "Unknown";
        apiAvailable: boolean;
        noCodeFriendly: boolean;
        waitlistRequired: boolean;
        paidOnly: boolean;
    };
    perks: string[];
    limitations: string[];
    tutorial: {
        title: string;
        goal: string;
        estimatedTime: string;
        difficulty: string;
        toolsNeeded: string[];
        steps: string[];
        prompt: string;
        expectedOutput: string;
        commonMistakes: string[];
        nextStep: string;
    };
    promptPack: {
        student: string;
        coding: string;
        marketing: string;
        design: string;
        research: string;
        career: string;
    };
    miniProject: {
        title: string;
        difficulty: string;
        estimatedTime: string;
        toolsNeeded: string[];
        skillsLearned: string[];
        portfolioValue: "Low" | "Medium" | "High";
        steps: string[];
        output: string;
    };
    sourceType: "Live" | "Mock"; // "Live" = pulled via Exa + generated via OpenAI
    isSaved: boolean;
    isFeatured: boolean;
}
```

Required sample headlines (≥12): text-to-video demos · AI slide tools · coding copilots for beginners · research-paper simplifiers · campaign-visual image AI · AI agents for workflows · resume/cover-letter tools · open-source LLMs · voice/narration AI · no-code AI workflows · AI mockup/design assistants · AI analytics for business.

---

## 8. Design System

- Dark gradient background (deep navy / black / purple / blue)
- Glassmorphism cards, rounded corners, soft glowing accents, smooth transitions
- Accent colors: electric blue, violet, cyan, pink
- Clean sans-serif; large headings, small readable body (no tiny text)
- Rounded buttons, soft shadows, micro-animations
- Mobile-first: ~430px app container centered on desktop; fixed bottom nav; swipe/scroll-friendly cards
- Tone: simple, conversational, clear, not corporate — "explain AI like the user is a smart student, not a researcher"
- Feel: modern, fun, Gen Z, clean, slightly futuristic — an app, not a static website

---

## 9. Acceptance Criteria

1. Three working tabs: Radar, Search, Build
2. Radar shows update cards with scores, perks, tutorials, prompts, mini projects
3. Search searches and filters the dataset
4. Build shows saved tutorials and mini projects
5. Save, copy prompt, start project, mark complete all work
6. Progress persists via `localStorage`
7. Responsive, mobile-first
8. Polished, modern UI
9. ≥12 realistic AI update/tool items
10. The demo flow works end-to-end

**Rubric-tier criteria (to actually place):** 11. Exa powers real news retrieval + search (live, not mock) 12. OpenAI generates at least the Hype Filter scores + "why it matters" + one tutorial live 13. _(Stretch)_ Zo runs a scheduled daily refresh that pings the user

---

## 10. Demo Flow (optimize for this end-to-end)

1. Open AI Radar → see Today's Pick on Radar
2. Tap "Why it matters" / expand details
3. Tap "Try Tutorial"
4. Copy a prompt (toast)
5. Save the update (toast)
6. Go to Search → search "AI tools for presentations"
7. View results → compare two tools
8. Go to Build → saved tutorial is there
9. Start a mini project → mark it complete
10. Generate a LinkedIn post / GitHub README
11. Progress tracker updates

**Demo safety:** keep the mock dataset wired as a fallback so a flaky network can't break the live Exa/OpenAI path mid-demo.

---

## 11. In-App Copy (use these lines)

- Homepage subtitle: "Fresh AI updates turned into tutorials, prompts, and mini projects."
- Radar intro: "Stop doomscrolling AI news. Start building with it."
- Search subtitle: "Find AI tools, updates, tutorials, prompts, and student-friendly perks."
- Build subtitle: "Your saved tutorials and mini projects live here."
- Build intro: "Every AI update becomes something you can try, build, and show."
- Hype filter explainer: "Not every AI launch is worth your time. AI Radar separates hype from practical value."
- Portfolio section: "Turn what you learned into proof of work."
