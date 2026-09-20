---
phase: 2
title: Frontend pre-select current lesson
status: completed
priority: P2
effort: 1h
dependencies:
  - '1'
---

# Phase 2: Frontend pre-select current lesson

## Overview

`/study` tự chọn sẵn level + chip bài đang học khi mở trang (trước khi user bấm), dựa trên endpoint Phase 1. User vẫn chọn tay như cũ.

## Requirements

- Functional: mở start screen → course đang học + chip "Bài N" được chọn sẵn; bấm mode → học đúng bài đó (flashcard + quiz). Chọn tay ghi đè.
- Non-functional: không thêm i18n key; fallback null → hành vi cũ; `npm run build` pass.

## Architecture

Effect mới trong `VocabularyStudyPage` (chạy khi `hskLevels` thay đổi lần đầu):
1. Gọi `dailySessionApi.getCurrentLesson()` (method mới trong `frontend/src/api/daily-session.ts`)
2. Guard: chỉ áp dụng khi `selectedLevel === null` (user chưa bấm) — dùng ref hoặc check trực tiếp state trong `.then` kèm cờ `cancelled` theo pattern effect hiện có của page
3. Match level: `hskLevels.find(l => l.id === courseId)` → `setSelectedLevel(level)`; `setSelectedLessonId(lessonId)`
4. Effect lessons hiện có tự tải danh sách bài khi `selectedLevel` set → chip highlight sẵn
5. Null / course không có trong list / fetch lỗi → bỏ qua, không pre-select (hành vi cũ)

URL params: pre-select chỉ áp dụng cho start screen thuần (không có `level`/`mode` trong URL) — effect restore URL đã xử lý trường hợp có params; pre-select effect bỏ qua khi URL đã có params để không tranh chấp.

## Related Code Files

- Modify: `frontend/src/api/daily-session.ts`, `frontend/src/pages/vocabulary/vocabulary-study-page.tsx`
- Đọc tham khảo: `frontend/src/api/hsk-api.ts` (shape HskLevel có `id`), backend DTO Phase 1

## Implementation Steps

1. `daily-session.ts`: thêm type + `getCurrentLesson(): Promise<CurrentLesson | null>` theo pattern method hiện có (fetch + error handling của file).
2. `vocabulary-study-page.tsx`: thêm effect pre-select theo Architecture (guard `selectedLevel === null`, cờ cancelled, bỏ qua khi URL có level/mode).
3. Build `cd frontend && npm run build`.
4. Test tay: login user có tiến độ → `/study` → chip bài đang học chọn sẵn; bấm Quiz → header đúng bài đó; bấm "Tất cả" rồi mode → vẫn học cả level; login user mới → bài 1; account học xong hết (hoặc mock null) → không pre-select.

## Success Criteria

- [ ] Pre-select đúng course + bài, cả 2 mode học đúng phạm vi
- [ ] Chọn tay ghi đè; user mới → bài 1; null → fallback cũ
- [ ] Build pass

## Risk Assessment

- Race: guard `selectedLevel === null` trong `.then` — nếu vẫn lệch (bấm giữa lúc fetch về), cờ cancelled pattern của page đã xử lý unmount.
- `selectedLessonId` set trước khi lessons list tải xong → chip chưa render cho tới khi list về; header fallback "Bài học" chấp nhận được trong <1s.
