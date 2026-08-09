# ElimuNova AI — AI Capability & Intelligence Audit

_Last updated: 2026-08-06 · Method: static code analysis of `src/`, `prisma/schema.prisma`, config & infra. No changes made by this audit._

---

## Executive Summary

ElimuNova has **real, genuinely-integrated AI** — there is no mocked AI anywhere. Every generative route calls a live 9-provider LLM waterfall (`src/lib/ai-provider.ts`), with a Prisma/Neon data layer, an SM-2 spaced-repetition engine, a pgvector RAG pipeline, deterministic + LLM hybrid grading, and per-tier rate limits/quotas enforced in Redis.

The platform is **uneven**, however. The flagship student surface (Hope AI drawer) runs on the **weakest** prompt path in the app, while the deepest adaptive machinery (dynamic student-context builder, mastery engine, RAG) exists and is simply **not wired to the right surfaces**. Several high-value background jobs and token-costing hooks exist but are **dormant**. No AI endpoint streams tokens.

---

## 1. Overall AI Maturity Level

### Score: 3.5 / 5 — “Contextual & Cached AI” (Level 3), with fragmented Level-4 capabilities

| Level | Description | Where ElimuNova sits |
|---|---|---|
| 1 | Static / Mocked | ✗ Nowhere — all AI is real LLM calls |
| 2 | Reactive (LLM works, no memory/context) | **Hope AI drawer, socratic/voice/alexa chat, checkpoint/bloom quizzes** |
| 3 | Contextual & Cached (persisted history, role-aware prompts, DB caching) | **Schemes, lesson-plans, assignment grading, autonomous tutor, RAG on 2 teacher routes, persisted teacher artifacts** |
| 4 | Adaptive & Diagnostic (personalized recs, weak-area detection, hybrid grading) | **Recommendations API, SM-2 engine + mastery decay, adaptive difficulty, hybrid assignment grading** |
| 5 | Autonomous agentic learning engine | ✗ Not present |

**Why 3.5:** solid Level 3 across most surfaces + real Level 4 *rule-based* adaptivity (spaced repetition, mastery decay, adaptive difficulty, hybrid grading) — but blocked from Level 4-5 by: (a) no streaming, (b) the main tutor ignoring its own dynamic context, (c) no AI-response caching, (d) dormant cron jobs, (e) dead token accounting, and (f) no predictive/ML forecasting.

### Dimension scorecard

| # | Dimension | Score | One-line verdict |
|---|---|---|---|
| 1 | Context-aware tutoring (Hope AI) | **2.5** | Real LLM, but static prompt, no history, no streaming; dynamic context exists but is unreachable from the drawer |
| 2 | Generative content & RAG | **3.0** | Real multi-provider generation; pgvector RAG exists but wired to only 2 of ~20 routes |
| 3 | Automated grading & assessment | **3.5** | Genuine deterministic+LLM hybrid in assignments; practice graded client-side with no numeric/fuzzy tolerance |
| 4 | Adaptive learning & recommendations | **4.0** | Best-in-class here: live-data recommendations, SM-2 SR, adaptive difficulty, mastery decay |
| 5 | Predictive analytics | **2.5** | Strong descriptive aggregates; alerts are deterministic rules with hardcoded “AI” strings; cron jobs unscheduled |
| 6 | Cost & performance infrastructure | **3.0** | Great provider waterfall + rate limits; no streaming, no zod output validation, token accounting dead |

---

## 2. Six-Dimension Deep-Dive

### Dimension 1 — Context-Aware AI Tutoring (Hope AI) — 2.5/5

**Verdict: Real LLM, Level-2 prompt quality, Level-3 context infrastructure left unplugged.**

| Question | Verdict | Evidence |
|---|---|---|
| Student page context, subject, grade, topic passed? | **PARTIAL** | Subject+topic reach the API; **grade & active page are never sent**; the drawer never sends `context`, so the model’s system prompt contains neither subject nor topic. `src/components/ai-tutor-drawer.tsx:106-116` (body = `{message, history, studentName, subject, topic}` only). `src/app/api/ai/chat/route.ts:21` default prompt has no subject/topic; the `student_tutor` branch that uses them is at `:35-90`. Grade exists in the page but is dropped: `src/app/student/learn/page.tsx:60-68` (`studyGrade`) → `:362`/`:639` `openAITutor(..., subject, topic)` (no grade). |
| Chat history persisted (Supabase/Neon) vs resets? | **PARTIAL** | DB models **exist**: `AITutorSession` (`prisma/schema.prisma:929-959`) and `TutorSession` (`:1433-1471`), written by the legacy/autonomous tutors (`api/student/tutor/message/route.ts:101`, `api/student/ai-tutor/route.ts:128`). **The Hope drawer writes nothing** — history is React state, remounted per open (`ai-tutor-provider.tsx:42` `key={sessionKey}`), and `ai-tutor-history.tsx` is orphaned (no importer). |
| Dynamic system-prompt injection (weak topics / mastery)? | **PARTIAL** | A rich builder exists — `buildStudentContext` (`src/lib/student-memory.ts:48-214`) injects grade, subject mastery %, accuracy, streak, preferred difficulty, common mistakes, **due-for-review topics** and stored memory facts. It is injected into the system prompt at `chat/route.ts:51` — **but only in the `student_tutor` branch the drawer never triggers**. The autonomous tutor does use it (`api/student/tutor/message/route.ts:45,92-97`; `src/lib/tutor-orchestrator.ts:447-453`). |
| Streaming? | **NO** | All 5 tutor/chat endpoints return `NextResponse.json(...)` after full generation. Drawer “streaming” is a fake 3-dot spinner (`ai-tutor-drawer.tsx:37,103`). |

**Key root cause:** the drawer (used by Learn, Dashboard, Assignments, Lesson Plans, Recommendations) and the personalized autonomous tutor are **two disconnected pipelines** with different prompts, contexts, and persistence.

---

### Dimension 2 — Generative Content & RAG Pipeline — 3.0/5

**Verdict: Real AI everywhere; RAG exists but is barely applied; caching partial.**

| Question | Verdict | Evidence |
|---|---|---|
| How are lessons/schemes/quizzes generated? | **REAL AI** | All routes call `OpenAIService.generateText/generateLongContent` (`src/lib/openai-service.ts:26-79`) → `callAI` waterfall (`src/lib/ai-provider.ts:180-407`) with 9 real providers + multi-key rotation. No mocks. **No streaming** (`stream: false` at `:282,:338`). |
| RAG / pgvector for CBC accuracy? | **PARTIAL** | Vector store exists via raw SQL (`prisma/migrations/pgvector-setup.sql` — `document_chunks` + ivfflat index; **not** in `schema.prisma`). `src/lib/rag-pipeline.ts` has chunk/ingest/search (`<=>` cosine). `src/lib/embeddings.ts` (OpenAI `text-embedding-3-small`). **Only consumed by `buildFullGenerationContext` (`src/lib/curriculum-intelligence.ts:246-283`) used in exactly 2 routes:** `generate-scheme-structured` and `generate-lesson-plan`. All other generation routes rely on raw LLM completion + static CBC prompt constants (`src/lib/cbc-context.ts`). DB curriculum outcomes injected only into schemes/lesson-plan/exam (`curriculum-intelligence.ts:131-184`, `smart-assessment.ts:116-120`). `supabase.ts` has **no** vector `rpc`/`match_documents` (storage buckets only). RAG failures are silently swallowed (`rag-pipeline.ts:133-136`). |
| Generated output cached (Supabase/DB)? | **PARTIAL** | Persisted: schemes (`generate-scheme-structured/route.ts:393-417`), lesson plans with dedupe (`generate-lesson-from-scheme/route.ts:155-189`), presentations (`AIGeneratedContent`, `schema.prisma:1236-1263`), images. **Not cached:** student lessons/notes/quizzes/exams — regenerate every request. The resume-cache column `TopicProgress.lastContent/lastPosition` (`schema.prisma:2087-2088`) is written only by an endpoint with no live caller (`learning-path/route.ts:219,226`); “Continue” in Learn just re-runs the LLM (`learn/page.tsx:314-316`). |
| Output validation? | **PARTIAL** | `cleanAiJson` (`src/lib/ai-generation-utils.ts:1-12`) strips fences + slices JSON. Robust paths: `generate-scheme-structured` (repairTruncatedJson + `buildFallbackScheme`), `generate-exam` (retries + `buildFallbackExam`). **Broken paths:** `checkpoint-quiz/route.ts:40-47` and `bloom-quiz/route.ts:68-76` do naive `JSON.parse` with **no try/catch** (500 on malformed JSON). **No zod output validation anywhere** — zod is used only for request bodies. |

---

### Dimension 3 — Automated Grading & Assessment Engine — 3.5/5

**Verdict: A genuine hybrid that is unevenly applied.**

| Question | Verdict | Evidence |
|---|---|---|
| How are practice/quiz answers evaluated? | **Deterministic (client-side)** for Learn-page recall + checkpoint quiz via `src/lib/answer-evaluator.ts` (27 lines: exact-match MCQ, normalized string equality + substring-include at `:13`). **Client-trusted** for course challenge (`course-challenge-widget.tsx:75-79` counts only MCQ/TF indices; server trusts the client-sent `correctAnswers`, `course-challenge/route.ts:144-145`). **Real LLM rubric** for assignments (`src/app/api/assignments/[id]/submit/route.ts`) and tutor chat. |
| Hybrid: deterministic fuzzy/numeric + LLM rubric? | **PARTIAL** | True hybrid only in assignment submission: objective questions graded against stored answer key (`submit/route.ts:8-11,52-108`), essays/short-answers → LLM sub-grading (`:111-141`) or rubric (`OpenAIService.gradeSubmission`, `openai-service.ts:232-293`). **No fuzzy/Levenshtein/string-similarity library anywhere** (package.json confirmed). **No numeric tolerance** — the normalizer strips `.`, so `5.0` ≠ `5` (`answer-evaluator.ts:16-22`). |
| Feedback dynamic/diagnostic? | **PARTIAL** | LLM paths produce tailored feedback (tutor `gradeAnswer` `tutor-orchestrator.ts:643-662`; `auto-mark` strengths/improvements `route.ts:44-49`; `gradeSubmission` rules `openai-service.ts:262-267`). Deterministic paths are static templates: `answer-evaluator.ts:25-26` (`“✓ Correct! Well done.”` / “Not quite. The correct answer is:…”`), grade-band openers (`submit/route.ts:145-152`). Practice explanations are **pre-baked per-question strings**, not answer-specific. **Mistake bank is a non-diagnostic localStorage log** (question/yourAnswer/correctAnswer only, `src/lib/mistake-bank.ts`); the DB `commonMistakes` column is **never written** (`common-mistakes.tsx` is always empty). |
| Grades stored? | **YES** | `Submission` (`schema.prisma:796-825`: `grade`, `feedback`, `status`, `isAiGraded`, `aiConfidence`, `questionScores`, `needsRevision`, `revisionNotes`), `CourseChallenge`, `QuizResult` (`:2171`), `PracticeAttempt` (`:2186`), `SkillMastery`, `UnitMastery`. No `Grade`/`QuizAttempt` model; no per-question answer storage for quizzes. |

**Dead/orphaned grading code:** `api/student/tutor/submit` (throws “No active question” — `currentQuestion` never set; no callers), `api/ai/grade-short-answer`, `api/ai/auto-mark` (both real AI, no frontend caller).

---

### Dimension 4 — Adaptive Learning & Recommendation Engine — 4.0/5

**Verdict: the platform’s strongest dimension — real rule-based adaptivity over live data.**

| Question | Verdict | Evidence |
|---|---|---|
| Recommendations adaptive from real data? | **REAL** | `api/student/recommendations/route.ts` computes everything from Prisma: subject grade aggregates `<60` weak / `>=75` strong (`:23-35`), weekly study sessions (`:71-73`), pending assignments (`:82-84`), **due ReviewSchedule items** (`:95-99`), weakest skills `<50` (`:110-115`), preferred difficulty (`:126-130`). No hardcoded rec lists; UI renders API only (`smart-recommendations.tsx:30-38`). |
| Spaced repetition (weak-topic auto-review)? | **PARTIAL** | Real **SM-2** engine: `ReviewSchedule` with `easeFactor/intervalDays/repetitions/nextReviewAt` (`schema.prisma:2033-2055`); algorithm at `api/student/review-schedule/route.ts:53-83` (reps 1→6→ease, floor 1.3); weak results pull review sooner (fail→1 day) in `src/lib/mastery-engine.ts:179-198`; cron bootstrap at `:262-276`. **Fragmentation:** the primary study UI uses a separate localStorage schedule (`learn/page.tsx:248-258,306-312`) that never touches `ReviewSchedule`; the DB-backed `SpacedRepetitionWidget` is never rendered (dead). Threshold is `<70` (not `<60`) for SR; quick-quiz results don’t feed the DB schedule. |
| Daily challenges / study paths hardcoded? | **PARTIAL** | Dashboard “Daily Challenge” is derived from the **real resume topic** from `learning-path` (`dashboard/page.tsx:89-95,220-226`), client-gated by a localStorage `daily_done` flag. Learn-page Daily Challenge is **dead code** (`dailyTopic` state never set — `learn/page.tsx:108-110,679`). Learning path = DB curriculum ordered by `order` + real `TopicProgress` statuses (`learning-path/route.ts:66-128`), with a static fallback list when curriculum isn’t seeded (`:5-20,92`). Gamification is real rule-based XP/streak logic but **localStorage-only** (`gamification.ts`). |
| Adaptive teaching (mastery gates, difficulty)? | **YES (rule-based)** | Difficulty recommender auto-persists `preferredDifficulty` at confidence ≥0.7 (`api/student/mastery/route.ts:145-169`); orchestrator picks mode/difficulty from weakest-skill mastery with dynamic thresholds (`tutor-orchestrator.ts:187-225,381-397`); forgetting-curve decay runs via cron + on ingest (`mastery-engine.ts:52-58,225`). **But:** “Mastery Gates” is display-only — nothing is gated/enforced (`mastery-gates.tsx:118` just calls `onSelectUnit`); Knowledge Map fabricates placeholder graphs when no data (`knowledge-map.tsx:88-104`); completing a lesson hardcodes `PROFICIENT`/`70` with no assessment (`learning-path/route.ts:188-203`). |

---

### Dimension 5 — Role-Based Predictive Analytics — 2.5/5

**Verdict: descriptive, not predictive — risk is binary thresholding with hardcoded “AI” text; the two background jobs that would make it automatic are unscheduled.**

| Question | Verdict | Evidence |
|---|---|---|
| Student risk alerts auto-generated? | **PARTIAL — rules, on-request** | `api/parent/alerts/route.ts` `buildAlerts()` is deterministic thresholds with template strings (e.g. `:78` `“AI analysis suggests they need additional support…”` — hardcoded). `api/parent/ai-insights/route.ts:53` `isAtRisk = grade<50 ‖ pending>5 ‖ mastery<40`; teacher `progress-monitor/route.ts:131-133`; `teacher/analytics/ai-insights/route.ts:221` hand-rolled risk score. **LLM analytics exist but are on-demand POSTs only** (`api/ai/learning-progress-analysis`, `api/ai/teaching-insights`). |
| Background job? | **EXISTS BUT DORMANT** | `/api/cron/parent-digest` (performance-drop rule, `:44-47`) and `/api/cron/adaptive-learning` (decay + SR bootstrap) exist. **`vercel.json` has no `crons` key** — nothing triggers them. |
| Predictive intelligence per role? | **DESCRIPTIVE ONLY** | Strong server-side aggregates per role (parent trends/engagement/live-metrics; teacher analytics/trends/risk-score; school-admin & super-admin KPIs). **No forecasting/ML/probability models anywhere.** Closest to “predictive” is deterministic mastery decay + spaced repetition (`mastery-engine.ts`). |

---

### Dimension 6 — AI Cost & Performance Infrastructure — 3.0/5

| Question | Verdict | Evidence |
|---|---|---|
| Token streaming for fast TTFT? | **NO** | No `ai`/`useChat`/`streamText`/`toDataStreamResponse` in the codebase. All AI routes return a single JSON blob. Only `/api/stream` is SSE — a generic event bus (chat/meetings), not AI tokens (`src/lib/sse-events.ts`). |
| Model fallbacks / rate-limit / JSON validators? | **YES / YES / NO** | **Waterfall:** 9-step real provider fallback + multi-key rotation + DB/env key override (`ai-provider.ts:74-87,149-177,180-407`). Coarse error handling (404/429/500 all → next key, no backoff). **Rate limits:** `rate-limit.ts:96-118` (AI 20/min/user), auto-applied to `/api/ai/*` + `generate-*` (`api-middleware.ts:161-176`), fail-open on cache errors. **Quotas:** per-tier daily/monthly call + token limits (`ai-usage.ts:17-26`). **JSON validation:** `cleanAiJson`+`JSON.parse` only — **no zod output schemas**; well-formed-but-wrong-shape JSON passes silently. |
| Caching to cut cost/latency? | **NO (AI responses)** | Redis used for rate limits, idempotency, usage counters only — **never caches LLM responses** (`redis.ts`). |
| Token accounting? | **DEAD** | `recordAIUsage(user.id)` is called with no token count (`api-middleware.ts:222-223`), so `maxTokensPerDay` is never enforced and “tokens this month” is always 0. The provider *does* return `tokensUsed` (`chat/route.ts:119`) but it’s never recorded. |
| Observability? | **GOOD** | Sentry DSN + traces (0.25) + console.error hook (`instrumentation.ts`); AI calls logged with provider/model/latency (`openai-service.ts:41`); usage stats via `api/ai/usage`. |

---

## 3. Component-by-Component Intelligence Status Table

| Route / Feature | Current Status | Maturity | Required Upgrade |
|---|---|---|---|
| **Hope AI drawer** (`components/ai-tutor-drawer`, `api/ai/chat` default path) | Real AI (LLM), static prompt | **L2** | Send `context:'student_tutor'` + grade → activates existing dynamic context; persist + resume chat; stream tokens |
| **Autonomous tutor** (`api/student/tutor/*`, `tutor-orchestrator.ts`) | Real AI + dynamic context + adaptive mode/difficulty + persisted sessions | **L3.5** | Stream tokens; fix dead `submit` endpoint; surface history UI |
| **Student memory extractor** (`lib/student-memory.ts`) | Real (extracts facts → DB) | **L4 infra** | Wire to drawer; let student view/edit memory |
| **Socratic / voice / Alexa chat** | Real AI, stateless | **L2.5** | Shared memory + streaming |
| **Scheme generation** (`generate-scheme-structured`) | Real AI + **RAG** + DB curriculum + persistence + robust JSON repair | **L4** | — (benchmark; extend RAG to other routes) |
| **Lesson-plan generation** | Real AI + RAG + DB curriculum | **L3.5** | Add fallback robustness like schemes |
| **Lesson notes / active lesson / assessment / exam / student ai-lessons** | Real AI, raw completion, no curriculum DB, no cache | **L2.5** | Inject `getCurriculumContext`/RAG; cache to `TopicProgress.lastContent`; zod output validation |
| **Checkpoint / Bloom quizzes** | Real AI generate; naive `JSON.parse`; client-side grade | **L2.5** | try/catch + zod; server-side grading |
| **RAG pipeline** (`rag-pipeline.ts`, pgvector) | Real infra, 2 of ~20 routes use it; failures swallowed | **L3.5 infra** | Expand to all generation routes; surface RAG availability in UI |
| **Content caching** (`TopicProgress.lastContent`) | Infra exists, no live caller | **L2 applied** | Write from Learn “Continue” + save; add content-hash dedupe |
| **Practice grading** (`answer-evaluator.ts`) | Deterministic exact-match, no numeric/fuzzy | **L2** | Add numeric tolerance + Levenshtein + LLM fallback for open answers |
| **Assignment grading** (`api/assignments/[id]/submit`) | **Hybrid**: answer-key deterministic + LLM rubric, persisted | **L4** | Add `isAiGraded` on auto-mark path; wire teacher-facing grading UI |
| **Course challenge** | Real AI generate; **client-trusted scoring** | **L2** | Server-side grading (integrity risk) |
| **Mistake bank** | localStorage, non-diagnostic | **L2** | LLM diagnostic “why wrong”; persist to DB `commonMistakes` |
| **Recommendations API** | Real rule-based over live Prisma data | **L4** | Add LLM ranking pass over candidates |
| **SM-2 spaced repetition** (`review-schedule`, `mastery-engine`) | Real SM-2 + weak-result auto-shortening + decay cron | **L4** | Unify with learn-page localStorage system; render the DB widget; feed quiz results in |
| **Adaptive difficulty** (`api/student/mastery` PUT) | Real threshold logic, auto-persists | **L4** | Gate content on mastery (real “gates”), not just badges |
| **Learning path** | DB curriculum order + real statuses; static fallback; PROFICIENT/70 shortcut | **L3** | Remove unassessed mastery shortcut; mastery-rank ordering |
| **Gamification** | Rule-based XP/streak, localStorage-only | **L3** | Persist to DB from server events |
| **Parent alerts / insights** | Deterministic threshold rules + hardcoded “AI” strings | **L2.5** | Real LLM insight pass; auto-run via cron |
| **LLM progress analysis / teaching insights** | Real AI, on-demand POST only | **L4** | Schedule + auto-deliver to roles |
| **Cron jobs** (`parent-digest`, `adaptive-learning`) | Real logic, **unscheduled** | **L3 dormant** | Add `crons` to `vercel.json` |
| **Provider waterfall** | Real 9-provider + key rotation | **L4** | Distinguish 429/5xx; add backoff |
| **Streaming** | None | **L1 gap** | SSE/`useChat` on tutor + generation routes |
| **Rate limits & tier quotas** | Real (call-based), fail-open | **L4** | Wire real token counts |
| **Token accounting** | Dead (`tokensUsed=0`) | **L2** | Pass provider tokens into `recordAIUsage` |
| **zod output validation** | None (only request bodies) | **L2** | Add zod schemas for generated JSON |
| **AI response caching** | None | **L2** | Redis content-hash cache for repeat prompts |
| **Observability** | Sentry + console AI logs | **L3.5** | Persist provider/cost ledger; Sentry tags per call |

---

## 4. High-Priority Action Plan — Top 3 Lowest-Hanging Changes

These three changes require **no new infrastructure** — they activate machinery that already exists — and together move the platform from “L2 tutor / L3 everywhere” to a coherent **Level 4**.

### ✅ 1. Plug Hope AI into its own dynamic-context branch (one-line client change → biggest maturity jump)

**Why:** The single largest inconsistency in the app. `buildStudentContext` (grade, subject mastery %, accuracy, streak, mistakes, **due-for-review topics**, memory facts) and the `student_tutor` prompt branch already exist — the drawer just never reaches them.

**How:** in `src/components/ai-tutor-drawer.tsx:106-116`, add `context: 'student_tutor'` and `grade` to the request body:
```ts
body: JSON.stringify({ message: text, history, studentName: name,
  subject, topic, grade, context: 'student_tutor' })
```
and in `src/components/ai-tutor-provider.tsx` / `openAITutor(...)`, thread the grade through (Learn page already tracks `studyGrade`, `learn/page.tsx:60-68`; add `grade` to the drawer props + provider signature).

**Impact:** Hope AI immediately becomes Level 3 (role-aware, mastery-injected system prompts) for every surface that opens it — Learn, Dashboard, Assignments, Lesson Plans.

### ✅ 2. Persist + resume Hope AI chat history in the DB (long-term memory)

**Why:** History currently resets on every open/refresh; the persistence model already exists (`AITutorSession`, `schema.prisma:929-959`).

**How:** in `src/app/api/ai/chat/route.ts` (student_tutor branch already resolves `studentId`), append `prisma.aITutorSession.create({ question, response, context, subject, topic, sessionType: 'hope' })` after each call (mirror `api/student/tutor/message/route.ts:101`), and add a GET that returns the last N messages for the student; load them into the drawer’s `messages` state on open.

**Impact:** Long-term memory → true Level 3, and the groundwork for Level 4 (tutor referencing past struggles).

### ✅ 3. Turn on the dormant cost + background-job infrastructure

**Why:** All the plumbing exists but is inert — this is free Level-4/5 signal for admins and parents.

**How:**
- **Token accounting:** pass the real token count through. `callAI`/`callHTTP` already returns `tokensUsed` (surfaced at `chat/route.ts:119`). Change `api-middleware.ts:222-223` (`recordAIUsage(user.id)`) to receive the tokens from the route (or have `OpenAIService` return them and thread through), so `maxTokensPerDay` quotas and cost reports become real.
- **Register the cron jobs:** add to `vercel.json`:
  ```json
  "crons": [
    { "path": "/api/cron/adaptive-learning", "schedule": "0 2 * * *" },
    { "path": "/api/cron/parent-digest", "schedule": "0 6 * * *" }
  ]
  ```
  This activates the existing mastery-decay + SM-2 bootstrap and the parent performance-drop alerts.

**Impact:** Real quota enforcement + automatic weak-area maintenance + automated parent risk alerts — moving Predictive Analytics from L2.5 to L3.5-4 with zero new logic written.

---

## Appendix — Extended backlog (beyond top 3)

| Priority | Change | Effort |
|---|---|---|
| H | Add zod output schemas + try/catch to `checkpoint-quiz`, `bloom-quiz` (currently 500 on malformed JSON) | S |
| H | Server-side grading for course challenge (stop trusting client `correctAnswers`) | M |
| H | Write `TopicProgress.lastContent` from Learn “Continue” to stop re-running the LLM | S |
| M | Add numeric tolerance + Levenshtein to `answer-evaluator.ts` | S |
| M | Unify spaced repetition: write learn-page reviews to `ReviewSchedule`, render `SpacedRepetitionWidget` | M |
| M | Remove unassessed `PROFICIENT`/`70` mastery shortcut on lesson completion | S |
| M | Wire RAG (`getCurriculumContext` + `retrieveRelevantContext`) into lesson-notes/active-lesson/assessment routes | M |
| M | Stream tokens (SSE) on the tutor + long-generation routes | M |
| M | Make “Mastery Gates” actually gate content (not just badges) | M |
| L | LLM ranking pass over rule-based recommendations | S |
| L | LLM-generated diagnostic explanations written to `StudentProgress.commonMistakes` (DB) | M |
| L | Redis content-hash cache for identical generation prompts | M |
| L | Predictive risk models (probability of falling behind) for teacher/parent/admin | L |

_Effort: S < 1 day · M 1–3 days · L 1+ week_
