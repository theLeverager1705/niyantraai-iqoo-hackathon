# NiyantraAI

**Intelligent AI Dependency Regulation System**

> Build with AI. Understand what you build.

**[Open the live demo →](https://theleverager1705.github.io/niyantraai-iqoo-hackathon/)**
 · no signup, click *Explore Dashboard*

NiyantraAI measures whether a developer's AI usage is turning into genuine
understanding. It does not count AI requests and it never recommends using AI
less. It measures the part where your own reasoning drops out of the loop.

Built as a prototype for the **iQOO Hackathon**.

---

## The problem

AI assistants can now generate an entire application, debug it, design its
architecture and document it. The code works, the demo passes, and nobody on
the team has a model of how it fits together. That failure only surfaces when
something breaks.

The product's whole thesis is one line:

> **AI usage is not the problem. Unconscious dependence is.**

---

## What it does

| Screen | What it answers |
| --- | --- |
| **Dashboard** | One AI-Human Balance Score, five metrics, today's single highest-impact recommendation |
| **AI Analytics** | Every raw signal behind every score, with week-over-week movement |
| **Prompt Intelligence** | How you ask, not how often — with a live rubric you can type into |
| **Project Understanding** | Adaptive questions about the code you actually shipped |
| **Adaptive Assessment** | Difficulty that moves with your answers, and shows you when it moves |
| **AI Coach** | Recommendations generated from your data, each with its evidence |
| **Weekly Report** | What improved, what needs attention, what to do next |
| **Achievements** | Behavioural benchmarks, recomputed every load — not engagement stickers |
| **Integrations** | Where AI activity could really come from, stated honestly |
| **Privacy & Settings** | Real toggles that change what is measured, plus export and delete |

### The differentiator: Project Understanding

A working application is not evidence that you understand it. NiyantraAI
generates adaptive questions about the project you built:

- *"What happens between the moment the user submits the login form and the moment authentication succeeds?"*
- *"Why did you choose JWT instead of server-side sessions? Give the trade-off you accepted, not just the benefit."*
- *"If the database becomes unavailable, which part of your application fails first?"*

Answers are scored on **concept coverage and causal reasoning**, not on
matching a model answer. Partial answers score partially, and the feedback
names exactly what was left out. Misconceptions are detected and corrected
by name. Results feed straight back into the dashboard, so the balance score
moves when your understanding does.

---

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173> and click **Explore Dashboard**.

Requires Node 18+. No API keys, no accounts, no database, no network calls.

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |
| `npm run calibrate` | Prints every number the engine produces for the demo dataset |

The build uses a relative base and a `HashRouter`, so `dist/index.html` also
works opened directly from disk or served from any sub-path.

---

## Demo mode (for judges)

**Explore Dashboard** on the landing page loads a pre-populated profile
instantly — Alex, an intermediate web developer building an *AI Resume
Analyzer* with ChatGPT, Claude and GitHub Copilot, with fourteen days of
history behind them.

A three to five minute walkthrough:

1. **Landing** → *Explore Dashboard*
2. **Dashboard** — balance 73/100, dependency 69%, and the band gauge showing
   that heavy AI use is not what is being penalised
3. **Prompt Intelligence** — the 94-scoring prompt next to the 41-scoring one,
   then type your own into the live rubric
4. **Project Understanding** → *Start knowledge check* — answer one question
   well and watch difficulty step **Intermediate → Advanced**; answer one
   badly and watch it step back down, with the misconception named
5. **Back to the dashboard** — the scores have moved
6. **AI Coach** — the recommendation, its evidence, and a working 15-minute
   independent challenge with a real timer
7. **Weekly Report** — what improved, what needs attention, what to do next

---

## How the scoring works

Every score is a transparent weighted blend of countable behaviour, labelled
in the product as a **prototype heuristic**. The methodology is rendered
inside the app, not hidden in a doc.

**AI Dependency** = 28% handover intensity + 22% substitution requests + 26%
problems not attempted first + 10% unexamined acceptance + 14% AI code
authorship.

**Independent Thinking** scores each behaviour against a *healthy target*
rather than against perfection — "100% of problems attempted alone first" is
neither realistic nor desirable.

**Code Understanding** = 55% assessment evidence + 45% observed behaviour, so
a high score cannot be earned by shipping alone.

**AI-Human Balance** = 34% human skill + 30% dependency health + 20% prompt
quality + 16% independent thinking. Dependency health peaks inside a **20–55%
band**: the model is a band, not a slope, because using AI heavily for
leverage is fine and only the runaway end is a risk.

**Learning Momentum** is week-over-week change in a capability index that is
deliberately anchored by the slower-moving assessment baseline, so one good
week cannot spike it.

These weights are chosen to be explainable. They are not a validated
psychometric instrument, and the product says so wherever a score appears.

---

## What is real and what is simulated

Being precise about this is a product requirement, not a disclaimer.

**Real, running code:**

- The analytics engine, prompt rubric, answer evaluator and adaptive
  assessment engine all execute on every load — nothing is a hardcoded number.
- The demo figures on the dashboard (dependency 68.6%, independent thinking
  73.4%, understanding 80.5%, prompt quality 85.5%, balance 73) are *computed*
  from 190 seeded interaction records by the same engine a real provider would
  feed. `npm run calibrate` prints them from the command line.
- Assessment answers are evaluated live, and results write back into the
  understanding profile and the dashboard metrics.

**Simulated, and labelled as such in the UI:**

- `src/data/demoDataset.ts` — the AI activity feed, generated from a fixed
  seed so every machine shows identical numbers.
- `src/services/mockGitHubService.ts` — repository analysis. Deterministic per
  repository URL, shaped exactly like the real GitHub API response would be.
- `src/services/llm/llmService.ts` — answer evaluation defaults to an
  on-device concept-coverage rubric. Set `VITE_LLM_API_KEY` and it routes to
  any OpenAI-compatible endpoint instead, falling back silently on any error
  so a demo can never be broken by the network.

**What this project will not claim:** there is no API that grants a third
party access to your private ChatGPT or Claude history. A real integration is
either an editor extension running locally with your consent, or an export you
choose to upload. The Integrations screen states this plainly for every
provider.

---

## Architecture

The product is built around one seam — the **AI Usage Provider**. Swap the
provider and every layer above it keeps working unchanged.

```
src/
  types/        Domain model: User, Project, AIInteraction, PromptAnalysis,
                Assessment, Question, SkillMetric, Recommendation, WeeklyReport
  data/         Taxonomy, seeded demo dataset, prompt bank, question bank,
                challenges, demo profile
  lib/          Pure logic, no React:
                  analyticsEngine.ts   scoring model + methodology
                  promptAnalyzer.ts    prompt rubric
                  answerEvaluator.ts   concept-coverage evaluation
                  assessmentEngine.ts  adaptive selection + difficulty ladder
                  recommendations.ts   coach card generation
                  weeklyReport.ts      report assembly
                  achievements.ts      benchmarks + XP
  services/     Orchestration and the integration seam:
                  providers/aiUsageProvider.ts   the interface + registry
                  providers/simulatedProvider.ts the prototype implementation
                  mockAIAnalyticsService.ts      pulls activity, runs lib/
                  mockAssessmentService.ts       wraps the engine + evaluator
                  mockGitHubService.ts           repository analysis
                  llm/llmService.ts              LLM abstraction
                  storage.ts                     local persistence
  hooks/        useAppState.tsx (store), useMediaQuery.ts
  components/   ui/ primitives, layout/, charts/, dashboard/, assessment/, coach/
  pages/        One file per screen
```

Analytics logic, the assessment engine, the AI service, mock data, the GitHub
integration and the storage layer are all separated, and `lib/` has no React
imports at all.

### Tech

React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS 3 · Recharts 2 ·
React Router 6 · lucide-react. Dark-first, responsive from 375px up, PWA
manifest, keyboard-navigable, with loading, empty, error and success states
throughout.

---

## Privacy

Everything NiyantraAI knows about you lives in your own browser. There is no
server, no account and no third party. The privacy screen has working controls
for AI activity tracking, GitHub access, analytics collection, prompt text
retention and anonymised benchmarks, plus full JSON export and delete. Turning
analytics off genuinely stops measurement rather than hiding it, and the
dashboard says so.

---

## For a production version

- Ship the VS Code / Cursor extension. It is the only source that can observe
  whether generated code was actually read, and every acceptance and
  modification metric depends on it.
- Replace `mockGitHubService` with real GitHub API calls and generate
  questions from the actual AST rather than from stack tags.
- Move answer evaluation to a model by default, with the current rubric as the
  offline fallback it already is.
- Persist history server-side so trends run longer than two weeks, which is
  what the momentum metric actually needs.
- Validate the scoring weights against outcomes — until then the product is
  right to call them a heuristic.

---

## Licence

MIT
