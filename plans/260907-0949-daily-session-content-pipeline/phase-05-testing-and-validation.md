---
phase: 5
title: "Testing and Validation"
status: in-progress
priority: P1
effort: "2h"
dependencies: ["1", "2", "3", "4"]
---

# Phase 5: Testing and Validation

## Overview

Verify the whole pipeline against the success definition: PDF-extracted JSON v2 imports via wizard, one-tap session runs 10-15 min with dialogue spaced repetition + SM-2 vocabulary, streak increments once daily. Backend automated tests + manual E2E script + real-device TTS check.

## Requirements

- Functional: full user journey works with a real custom-textbook v2 file
- Non-functional: backend `npm run build` + tests green; frontend `tsc` + `vite build` green; no regression in existing HSK1 flows (flashcards, quizzes, review dashboard still work)

## Architecture

Test layers:
- Unit (backend): dialogue interval schedule, plan composition + empty states, v2 import validation/re-idempotency, answer→grade mapping
- Integration/manual E2E: import → session → progress persistence
- Device check: TTS quality on Android/desktop Chrome (brainstorm's open risk)

## Related Code Files

- Create: `backend/src/daily-session/daily-session.service.spec.ts`, `backend/src/import/import-v2.spec.ts` (fixtures under `backend/src/import/test-fixtures/`)
- Read: existing spec patterns (if any) under `backend/src/` — match framework in use
- No frontend unit tests (no test infra present — do not introduce a framework now, YAGNI); frontend validated via build + manual script

## Implementation Steps

1. Backend unit tests: `DIALOGUE_INTERVALS` math (advance, fail-path, graduation at stage 4), `getDailySession` with seeded DB (due items, empty states, completed course)
2. Import tests: legacy file passes, v2 file passes, re-import idempotent, invalid pinyin/missing hanzi errors listed per item
3. Run full backend suite + builds; fix failures (no skipped/ignored tests)
4. Manual E2E script (document in phase file upon execution):
   - Import sample v2 custom course via `/import`
   - Login → `/today` → complete all steps → verify streak, dialogue nextReviewAt (+1d), lesson completed
   - Re-run session same day → shows "done today" state
   - Existing HSK1 flows regression: flashcards + review dashboard
5. Real-device TTS check (`zh-CN` voice, tone intelligibility); record verdict + fallback decision

## Success Criteria

- [x] All backend tests pass, builds clean, no ignored failures (verified 14/09: 68/68 jest, backend tsc clean, frontend build green)
- [ ] E2E journey passes: import → 1-tap session → durable progress (DB pre-seeded with lessons 1-15, so verify via /today session run)
- [ ] Session duration in 10-15 min band with seeded content (5-8 keywords, ~10 dialogue lines, ≤15 due vocab)
- [ ] TTS verdict recorded; go/no-go decision for future manual-audio fallback
- [ ] Existing HSK1 features show no regression — ⚠️ BLOCKED: HSK1 course is empty in DB (0 lessons/vocab after schema generalization; only HSK2 15 lessons present). Re-import HSK1 content via legacy importer or de-scope HSK1.

## Progress Log

### 14/09/2026 — automated verification
- Backend containers up with new code (GET /daily-session → 401 guard, POST /tts/synthesize → 401, GET /audio/:key → 400, GET /hsk → 200 with 2 courses)
- Prisma: 6 migrations applied, schema up to date
- DB content: 15/15 HSK2 lessons, 171 vocab, 230 conversations, 1 dialogue_progress
- Azure TTS key configured (southeastasia); frontend 200 OK
- Remaining: manual /today session run (streak + nextReviewAt + done-today state), TTS device check

## Risk Assessment

- Test framework may not exist in backend yet → add minimal (Jest is NestJS default) scoped to new modules only
- Real-device variability (TTS voices) → verdict is informational; fallback is future scope

## Security Considerations

- Tests use seeded test user; no real credentials in fixtures

## Next Steps

- User supplies real textbook PDF → AI extracts JSON v2 → import via wizard (operational flow, no code)
- Follow-up candidates (out of scope): auth-gate `/import`, HSK2-6 import via same pipeline, manual audio fallback
