---
phase: 1
title: Schema backend dialogue English
status: completed
priority: P1
effort: 1h
dependencies: []
---

# Phase 1: Schema + backend dialogue English

## Overview

Thêm cột `english` vào `Conversation` và wire qua toàn bộ backend (DTO import + mapper + daily-session).

## Requirements

- Functional: API trả `english` cho mỗi dòng hội thoại.
- Non-functional: migration additive (không drop cột), build + test pass.

## Related Code Files

- Modify: `backend/prisma/schema.prisma` (thêm `english String?` vào model Conversation)
- Create: migration `add_conversation_english`
- Modify: `backend/src/import/dto/import-textbook-v2.dto.ts` (`TextbookV2ConversationItemDto` thêm `english?: string`)
- Modify: `backend/src/import/mappers/json-v2.mapper.ts` (`toConversationCreate` thêm `english: conv.english`)
- Modify: `backend/src/daily-session/dto/daily-session.dto.ts` (`DialogueLineDto` thêm `english: string | null`)
- Modify: `backend/src/daily-session/daily-session.service.ts` (`toLineDto` thêm `english: conversation.english`)

## Implementation Steps

1. `schema.prisma`: thêm `english String?` vào model `Conversation` (sau `vietnamese`).
2. Tạo migration: `ALTER TABLE "conversations" ADD COLUMN "english" TEXT`.
3. `import-textbook-v2.dto.ts`: `TextbookV2ConversationItemDto` thêm `english?: string`.
4. `json-v2.mapper.ts` `toConversationCreate`: thêm `english: conv.english`.
5. `daily-session.dto.ts` `DialogueLineDto`: thêm `english: string | null`.
6. `daily-session.service.ts` `toLineDto`: thêm `english: conversation.english`.
7. `npx prisma generate` + `npx tsc --noEmit` + `npx jest`.

## Success Criteria

- [ ] DB có cột `english` trên `conversations`.
- [ ] `toLineDto` trả `english`; backend tsc + 105 tests pass.
- [ ] Migration áp dụng được trên DB.

## Risk Assessment

- `Conversation` dùng ở nhiều nơi (daily-session, spaced-repetition) → thêm cột nullable không vỡ.
- Re-import conversations thay thế toàn bộ dòng → đảm bảo mapper map `english` đúng (nếu dùng re-import).
