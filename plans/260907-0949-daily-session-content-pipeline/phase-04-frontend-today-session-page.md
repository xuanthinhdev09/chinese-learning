---
phase: 4
title: "Frontend Today Session Page"
status: done
priority: P1
effort: "3h"
dependencies: ["3"]
---

# Phase 4: Frontend Today Session Page

## Overview

Single page `/today` running the 5-step session state machine (review due dialogues → shadow new dialogue → keyword practice → SM-2 due vocab → summary). Dashboard gets one prominent "Học hôm nay" button; login default lands on `/today`. Reuses flashcard/quiz components and TTS hook.

## Key Insights

- All practice components exist: `flashcard-card`, `quiz-card`, `use-chinese-tts` — composition, not new widgets
- "ĐƠN GIẢN" contract: user never picks lesson/mode; empty steps auto-skip
- Mobile-first (streak users practice on phone); dark mode via existing tokens

## Requirements

- Functional:
  - Step 1: due dialogues — compact read-through (line list + replay button), no rating needed for review passes
  - Step 2: new dialogue — sentence-by-sentence: pinyin (large) + hanzi + Vietnamese, TTS play/replay, per-sentence prev/next; end rating "Trôi ✓ / Chưa trôi ↻" → `POST dialogue-review`
  - Step 3: keywords — flashcard quick pass then meaning-choice quiz, each scored via existing SM-2 record API
  - Step 4: due vocabulary — flashcards (≤15), SM-2 record API
  - Step 5: summary — streak, counts, "Xong nhiệm vụ hôm nay" → back to dashboard
  - Session complete → `POST /daily-session/complete`
- Non-functional: no new state library — local React state machine in page; API errors show inline retry, never dead-end

## Architecture

```
pages/today/today-session-page.tsx        (state machine: fetch plan → steps → summary)
components/today/dialogue-reader.tsx      (line-by-line + TTS + rating)
components/today/practice-runner.tsx      (wraps flashcard-card / quiz-card sequences)
components/today/session-summary.tsx
stores/today-session-store.ts (only if cross-component step state needed — start without it)
Route: /today inside ProtectedLayout; unauthenticated → /login → back to /today
```

## Related Code Files

- Create: `frontend/src/pages/today/today-session-page.tsx`, `frontend/src/components/today/dialogue-reader.tsx`, `frontend/src/components/today/practice-runner.tsx`, `frontend/src/components/today/session-summary.tsx`, `frontend/src/api/daily-session.ts`
- Modify: `frontend/src/App.tsx` (route + login redirect target), `frontend/src/pages/dashboard/dashboard-page.tsx` (hero button + today status), `frontend/src/components/layout/` (nav item "Hôm nay")
- Reuse: `hooks/use-chinese-tts.ts`, `components/vocabulary/flashcard-card.tsx`, `quiz-card.tsx`, `stores/language-preference-store.ts`, `stores/vocabulary-store.ts` (record API)

## Implementation Steps

1. API client `daily-session.ts` (getDailySession, reviewDialogue, completeSession) with existing JWT fetch pattern
2. `dialogue-reader.tsx` — sentence carousel + TTS + rating buttons; unit-testable pure step logic kept in page
3. `practice-runner.tsx` — sequence runner over keyword/vocab lists mapping answers to SM-2 `quality` values (param name per `vocabulary-store.ts:59` `rateCard(vocabularyId, quality)`; quiz correct/wrong → existing quality values)
4. Page state machine with auto-skip of empty steps; summary + complete call
5. Dashboard button + route + nav; redirect chain login → /today
6. Mobile + dark-mode pass (existing Tailwind tokens)

## Success Criteria

- [ ] From login: 1 tap reaches learning; full session runs end-to-end against real backend
- [ ] Empty plan (nothing due, course finished) → friendly "đã học hết hôm nay" state, not error
- [ ] Mid-session refresh resumes at plan start (acceptable: restart session; no server session state by design)
- [ ] TTS plays per sentence on tap; works on desktop Chrome + Android Chrome

## Risk Assessment

- TTS voice quality (Web Speech API) is the shadowing weak link — verify early in this phase; fallback documented (manual audioUrl) but NOT built now (YAGNI)
- Answer→SM-2 `quality` mapping must match existing flashcard semantics — copy from `vocabulary-store` logic, don't invent

## Security Considerations

- All calls carry JWT via existing fetch wrapper; no new storage of user data client-side beyond existing preferences

## Next Steps

- Phase 5 end-to-end validation
