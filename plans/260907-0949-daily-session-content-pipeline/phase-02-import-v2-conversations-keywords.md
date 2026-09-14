---
phase: 2
title: "Import v2 Conversations + Keywords"
status: done
priority: P1
effort: "3h"
dependencies: ["1"]
---

# Phase 2: Import v2 Conversations + Keywords

## Overview

Extend the existing import pipeline (wizard UI unchanged) to accept JSON v2: `course` block with `type CUSTOM`, per-lesson `conversations` array, and `is_keyword` flag on vocabulary. HSK1-format files keep importing unchanged (backcompat).

## Key Insights

- Wizard UI + upload API already work — only backend validators/mappers/service change
- Re-import must be idempotent: replace lesson conversations, upsert vocab (existing behavior is the reference)
- PDF→JSON conversion happens OFFLINE (by AI + user spot-check) — app never parses PDF

## Requirements

- Functional:
  - v2 format: `{ course: { name, type: "HSK"|"CUSTOM", level, description? }, lessons: [{ title, order, vocabulary: [...{is_keyword?}], conversations: [{ order, hanzi, pinyin, vietnamese }] }] }`
  - `type CUSTOM` → find-or-create Course by (name); `HSK` → existing level-based path
  - `is_keyword: true` → `Vocabulary.isKeyword`
  - Validation errors reported per-lesson/line like existing validator output (missing pinyin, empty hanzi, tone-mark warnings)
- Non-functional: wizard upload flow + response shape unchanged; import of old `hsk1_enhanced.json` must still succeed

## Architecture

Data flow (2 entry points, same core): 
- **Script (primary for custom textbook):** user drops PDF into `content-source/pdf/` → AI extracts JSON v2 to `content-source/extracted/<name>.json` (offline, outside repo) → `npm run import:textbook -- <file>` → script → `import.service` v2 branch
- **Wizard (kept for ad-hoc/HSK):** file upload → controller → same service branch
- Core: `import.service.ts` detects format (`course` block present = v2, else legacy) → v2 validators (`validators/`) → v2 mappers (`mappers/`) → Prisma upsert (Course → Lessons → Vocabulary + Conversations in transaction)

`content-source/` convention (workspace root, outside repo — consistent with `hsk_data/`): `pdf/` (originals), `extracted/` (JSON v2, reviewed before import). Never committed to git (copyright + size).

## Related Code Files

- Modify: `backend/src/import/import.service.ts` (format branch + course upsert)
- Create: `backend/src/import/validators/json-v2.validator.ts`, `backend/src/import/mappers/json-v2.mapper.ts`
- Create: `backend/src/scripts/import-textbook-v2.ts` (CLI arg = JSON path; follows `import-hsk30-vocabulary.ts` bootstrap pattern; calls import service — no direct Prisma writes)
- Modify: `backend/package.json` (`import:textbook` script), `backend/src/import/dto/` (v2 DTO)
- Modify (docs): `docs/hsk-data-guides/data-import-guide.md` — v2 schema section + content-source workflow
- Optional: import-page validation summary shows conversations count

## Implementation Steps

1. Define v2 DTO + validator (required fields, conversation order uniqueness, pinyin non-empty; map optional `speaker`; tolerate extra meta fields like `source_pages` by ignoring them; warn when pinyin lacks tone marks)

<!-- Updated: Self-audit session 260907 - speaker field added to spec; validator must ignore extra extraction meta fields; pinyin cross-check via pypinyin script recommended in batch workflow -->
2. Mapper: v2 → entities; keyword flag; conversation replace-per-lesson (delete + recreate within transaction)
3. Service branch: detect v2 vs legacy; resolve Course (CUSTOM find-or-create by name; HSK existing lookup); run mapper inside existing import transaction pattern
4. Script entry `import-textbook-v2.ts`: read JSON path from argv, validate, invoke service, print per-lesson import summary + error list; register `import:textbook` npm script
5. Auth-gate import controller: `@UseGuards(JwtAuthGuard)` per `spaced-repetition.controller.ts:8` pattern; wizard already sends JWT
6. Unit-test fixtures: `hsk1_enhanced.json` (legacy, must pass), sample v2 custom textbook file (pass), v2 missing pinyin (fail with clear message)
7. Update data-import-guide.md with v2 template for PDF-extraction output + content-source folder workflow

<!-- Updated: Validation Session 2 - user decision: script-based import is the primary entry for custom textbook; content-source folder convention added; wizard kept -->

<!-- Updated: Validation Session 1 - added step 4 JwtAuthGuard on import controller -->
<!-- Updated: Validation Session 1 - corrected streak-related wording lives in phase-03; no cross-impact here -->

## Success Criteria

- [ ] Legacy `hsk1_enhanced.json` imports unchanged
- [ ] v2 custom file imports: Course CUSTOM created, conversations visible in DB, keywords flagged
- [ ] Re-importing same v2 file does not duplicate rows
- [ ] Invalid file → actionable per-item error list in wizard
- [ ] `npm run import:textbook -- content-source/extracted/<file>.json` imports end-to-end from CLI
- [ ] Import endpoints reject unauthenticated requests (JwtAuthGuard active)

## Risk Assessment

- Conversation replace-on-reimport deletes old rows — acceptable (no per-conversation user data yet; `UserDialogueProgress` is lesson-level, survives re-import)
- Pinyin tone quality depends on offline extraction — mitigated by validator warnings + user spot-check

## Security Considerations

- Import endpoint was fully open (verified: no guard on `import.controller.ts`); this phase adds `JwtAuthGuard` — closes the hole while touching the module
- Frontend `/import` route stays reachable but API calls fail without login; wizard already carries JWT in fetch calls

<!-- Updated: Validation Session 1 - security decision: auth-gate import in this phase (user choice), was follow-up -->

## Next Steps

- Phase 3 daily-session reads conversations + keywords
