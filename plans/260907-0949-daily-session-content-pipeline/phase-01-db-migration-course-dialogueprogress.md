---
phase: 1
title: "DB Migration Course + DialogueProgress"
status: done
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: DB Migration Course + DialogueProgress

## Overview

Generalize `HskLevel` into a multi-source `Course` model (HSK + custom textbooks) and add dialogue spaced-repetition tracking (`UserDialogueProgress`) plus the `isKeyword` flag on vocabulary. Zero data loss — table `hsk_levels` kept via `@@map`.

## Key Insights

- `HskLevel.level Int @unique` blocks a second book — must relax for custom textbooks
- `Conversation` model already exists in DB (unused by UI) — no new dialogue table needed
- SM-2 pattern in `UserVocabularyProgress` is the template for dialogue progress

## Requirements

- Functional: multiple courses can coexist (HSK1 + custom textbook); each lesson's dialogue has a review schedule (1→3→7→14 days, stage 4 = graduated); vocabulary rows can be flagged as lesson keywords
- Non-functional: migration must be idempotent-safe and reversible in dev; existing HSK1 data untouched

## Architecture

```
Course (renamed from HskLevel, @@map "hsk_levels")
  + type String @default("HSK")     // "HSK" | "CUSTOM"
  - level Int (unique constraint DROPPED)
UserDialogueProgress (new, @@map "user_dialogue_progress")
  id, userId→User, lessonId→Lesson, stage Int @default(0),
  lastReviewedAt DateTime?, nextReviewAt DateTime?,
  @@unique([userId, lessonId]), @@index([userId, nextReviewAt])
Vocabulary
  + isKeyword Boolean @default(false)
Conversation (existing table, @@map "conversations")
  + speaker String?   // dialogue line speaker (妈妈/明明) — required for dialogue reader UI
```

Dialogue intervals: `stage 0→+1d, 1→+3d, 2→+7d, 3→+14d, 4 = graduated (no schedule)`.

## Related Code Files

- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<timestamp>_generalize_course_and_dialogue_progress/migration.sql`
- Modify (rename refs `hskLevel` → `course` in Prisma client usage): `backend/src/hsk/`, `backend/src/lessons/`, `backend/src/import/`, `backend/src/vocabulary/` (grep `hskLevel|HskLevel` to enumerate)
- API responses keep shape + add fields (backcompat: frontend HSK pages keep working)

## Implementation Steps

1. Edit `schema.prisma`: rename model, add `type`, drop `@unique` on `level`, add `UserDialogueProgress`, add `Vocabulary.isKeyword`; add relations (`User.userDialogueProgress`, `Lesson.dialogueProgress`)
2. Generate migration (`prisma migrate dev --name generalize_course_and_dialogue_progress`); review SQL: `ALTER TABLE hsk_levels ADD COLUMN type TEXT NOT NULL DEFAULT 'HSK'; DROP CONSTRAINT unique level; CREATE TABLE user_dialogue_progress ...; ALTER TABLE vocabularies ADD COLUMN is_keyword BOOLEAN NOT NULL DEFAULT false; ALTER TABLE conversations ADD COLUMN speaker TEXT NULL;`
3. Rename TypeScript refs via IDE-wide rename / grep-and-fix; run backend build until compile-clean
4. Seed/verify: existing HSK1 rows get `type='HSK'`; smoke-test `/hsk` endpoints still return data

## Success Criteria

- [ ] `npx prisma migrate dev` applies cleanly on current DB with HSK1 data intact
- [ ] Backend compiles (`npm run build` in backend/), all existing endpoints behave unchanged
- [ ] `UserDialogueProgress` + `Vocabulary.isKeyword` present in DB

## Risk Assessment

- Rename touches many files → mitigate with grep `hskLevel|HskLevel` enumeration before editing
- Migration on dev DB with data → backup `pg_dump` first; data volume is tiny (150 words)

## Security Considerations

- No auth surface change; `UserDialogueProgress` is per-user (unique userId+lessonId prevents cross-user pollution)

## Next Steps

- Phase 2 (import v2) consumes `Course.type` + `isKeyword`
