---
phase: 3
title: "Backend Daily Session Module"
status: pending
priority: P1
effort: "4h"
dependencies: ["1", "2"]
---

# Phase 3: Backend Daily Session Module

## Overview

Thin `daily-session` NestJS module composing the daily plan from existing data: dialogues due for review, next lesson's dialogue + keywords, vocabulary due (SM-2 ≤15), streak. Dialogue review recording endpoint. Vocabulary scoring reuses existing spaced-repetition API — no duplication.

## Key Insights

- All heavy lifting exists: SM-2 service, streak logic (review dashboard stats), progress endpoints
- Session plan is a pure read-composition — keep it one endpoint so frontend stays dumb
- "Next lesson" = lowest `order` lesson in active course without `UserProgress.isCompleted` (linear path through textbook)

## Requirements

- Functional:
  - `GET /daily-session` → `{ dueDialogues: [{lessonId, lessonTitle, conversation}], nextLesson: {lessonId, lessonTitle, conversation, keywords[], vocabulary[]}, dueVocabulary: [{...vocab, progress}], streak, completedToday: boolean }`
  - `POST /daily-session/dialogue-review` `{lessonId, passed}` → passed: `stage=min(stage+1,4)`, `nextReviewAt=now+interval[stage]`; failed: `stage` unchanged, `nextReviewAt=now+1d`; upsert `UserDialogueProgress`
  - `POST /daily-session/complete` `{lessonId}` → set `UserProgress.isCompleted`, return `{streak, summary}`
- Non-functional: plan endpoint ≤3 queries (single user, tiny data); all endpoints JWT-auth guarded (existing guard pattern)

## Architecture

```
daily-session.controller.ts  (JwtAuthGuard)
daily-session.service.ts
  ├─ dueDialogues: UserDialogueProgress.nextReviewAt <= today (include lesson.conversation)
  ├─ nextLesson: lessons orderBy order, first without completed UserProgress
  │     in the ACTIVE course — active = courseId query param if given,
  │     else the course owning the most recent lesson lacking completed
  │     progress; fallback = most recently created course when all done
  ├─ keywords: vocabulary where isKeyword, take 8
  ├─ dueVocabulary: UserVocabularyProgress.nextReviewAt <= now, take 15
  └─ streak: reuse `calculateStreak` from spaced-repetition.service.ts:271
DIALOGUE_INTERVALS = [1, 3, 7, 14] days
COMPLETED_TODAY (PINNED — was open): completedToday = ∃ dialogue review
  (UserDialogueProgress.lastReviewedAt) recorded today for the user.
  Simple, monotonic, no new table. Lesson completion is separate signal.
```

<!-- Updated: Validation Session 1 - streak source corrected (spaced-repetition service, not vocabulary); completedToday confirmed derived, no new table -->

## Related Code Files

- Create: `backend/src/daily-session/daily-session.module.ts`, `daily-session.controller.ts`, `daily-session.service.ts`, `dto/`
- Modify: `backend/src/app.module.ts` (register module)
- Read/reuse: `backend/src/spaced-repetition/` (SM-2 + streak), `backend/src/vocabulary/` (progress endpoints reused by frontend, NOT re-wrapped)

## Implementation Steps

1. Scaffold module; wire into `app.module.ts`
2. Service: `getDailySession(userId, courseId?)` — compose the sections; `completedToday` per pinned rule in Architecture (∃ dialogue review recorded today)
3. `recordDialogueReview(userId, dto)` — interval table, upsert
4. `completeSession(userId, dto)` — mark lesson completed, return streak summary
5. DTO validation (class-validator), e2e-style unit tests: schedule math (stage 0→4, fail path), plan composition with empty states (no due vocab, all lessons completed)

## Success Criteria

- [ ] `GET /daily-session` returns coherent plan for a user with imported custom course
- [ ] Dialogue review updates schedule per interval table; failed review does not advance stage
- [ ] Completing session marks lesson progress + streak increments once per day
- [ ] All endpoints require auth; empty-state responses are valid (arrays empty, nulls explicit)

## Risk Assessment

- Streak logic duplication → reuse, do not copy; if existing streak is per-vocabulary-review only, wrap it (single source of truth)
- Timezone: "today" boundaries — use server-local Asia/Saigon consistently with existing streak code

## Security Considerations

- JWT guard on all routes; all queries scoped `userId` from token (never from body)

## Next Steps

- Phase 4 consumes plan + record endpoints
