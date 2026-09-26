---
phase: 1
title: "Backend completion model"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Backend completion model

## Overview

Mở rộng `UserProgress` thành model hoàn thành 3 flag (từ vựng / luyện nghe / exercises). `isCompleted` trở thành giá trị derive (true khi đủ 3), giữ nguyên toàn bộ lock logic hiện tại. Thêm endpoint `POST /daily-session/activity-complete`.

## Requirements

- Functional:
  - `UserProgress` thêm 3 cột nullable: `vocabCompletedAt`, `dialogueCompletedAt`, `exercisesCompletedAt`.
  - `isCompleted` + `completedAt` được **derive** khi cả 3 flag đều set.
  - Endpoint `POST /daily-session/activity-complete` nhận `{ lessonId, activity: 'vocab'|'dialogue'|'exercises' }`, upsert timestamp tương ứng.
  - <!-- Validation 260925-1048: thêm GET status --> Endpoint `GET /daily-session/lesson-status?lessonId=` trả `{ lessonId, vocabCompletedAt, dialogueCompletedAt, exercisesCompletedAt, isCompleted }` để wizard khôi phục tiến độ khi reload.
  - Đánh dấu **sticky**: đã set thì không gỡ (idempotent).
  - `activity` không hợp lệ → 400; `lessonId` không tồn tại → 404.
- Non-functional:
  - Migration thêm cột nullable = backward compatible, không mất data.
  - Lock tuần tự (`userProgress: { none: { isCompleted: true } }`) **KHÔNG đổi**.
  - Admin bypass (ADMIN_EMAILS) **KHÔNG đổi**.
  - `getCurrentLesson` **KHÔNG đổi** (vẫn dựa `isCompleted`).

## Architecture

```
POST /daily-session/activity-complete { lessonId, activity }
  → DailySessionService.completeActivity(userId, lessonId, activity)
    → lesson.findUnique (404 nếu thiếu)
    → userProgress.upsert(userId_lessonId) set timestamp theo activity
    → đọc lại 3 flag → isCompleted = cả 3 non-null → ghi isCompleted + completedAt
  → trả { lessonId, vocabCompletedAt, dialogueCompletedAt, exercisesCompletedAt, isCompleted }

GET /daily-session/lesson-status?lessonId=
  → DailySessionService.getLessonStatus(userId, lessonId)
    → userProgress.findUnique(userId_lessonId) → trả 3 flag + isCompleted (flag null nếu chưa có bản ghi)
```

Điểm quyết định (để ở đây, không đoán trong code):
- **Dialogue**: endpoint mới `activity-complete` ghi `dialogueCompletedAt`; KHÔNG đụng `recordDialogueReview` (SRS stage riêng). Khi user pass shadowing ở wizard → gọi `activity-complete(dialogue)` một lần (sticky).
- **Không** thay đổi `completeSession` hiện có (giữ legacy cho /today), tránh gãy hành vi cũ trong giai đoạn chuyển tiếp.

## Related Code Files

- Modify: `backend/prisma/schema.prisma` (model `UserProgress`)
- Modify: `backend/src/daily-session/daily-session.service.ts`
- Modify: `backend/src/daily-session/daily-session.controller.ts`
- Modify: `backend/src/daily-session/dto/daily-session.dto.ts`
- Test: `backend/src/daily-session/daily-session.service.spec.ts` (tạo mới nếu chưa có)

## Implementation Steps (--tdd: test trước)

1. **Viết test thất bại** trong `daily-session.service.spec.ts`:
   - `completeActivity(vocab)` → upsert có `vocabCompletedAt` set, `isCompleted=false` (chưa đủ 3).
   - Gọi đủ `vocab + dialogue + exercises` → `isCompleted=true` + `completedAt` set.
   - `activity` không hợp lệ → lỗi (BadRequest).
   - `lessonId` không tồn tại → NotFound.
   - Sticky: gọi lại `completeActivity(vocab)` không gỡ `vocabCompletedAt`.
   - `getLessonStatus(lessonId)` trả 3 flag + `isCompleted`; bài chưa có bản ghi → flag null, `isCompleted=false`.
2. Chạy `npx jest daily-session.service.spec.ts` → xác nhận test đỏ.
3. **Migration**: thêm 3 cột vào `user_progress` trong `schema.prisma`, chạy `npx prisma migrate dev --name add_activity_completion`.
4. **Implement** `completeActivity` + `getLessonStatus` trong service + controller + DTO.
5. `npx tsc --noEmit` → 0 lỗi; `npx jest` → xanh (bao gồm cả spec vocabulary cũ không vỡ).

## Success Criteria

- [ ] 3 cột mới tồn tại trong DB (dev).
- [ ] `activity-complete` ghi đúng flag, derive `isCompleted` khi đủ 3.
- [ ] `lesson-status` trả đúng 3 flag + `isCompleted`.
- [ ] Test backend xanh (unit mới + vocabulary.service.spec cũ không vỡ).
- [ ] Lock tuần tự + admin bypass hoạt động y nguyên (regression).
- [ ] `npx tsc --noEmit` backend sạch.

## Risk Assessment

- **Migration prod**: cột nullable → an toàn, không lock table, không mất data. Chạy migrate lúc deploy.
- **Double-write dialogue**: nếu sau này cũng hook `recordDialogueReview`, phải đảm bảo không ghi `dialogueCompletedAt` 2 lần sai nghĩa. Quyết định: KHÔNG hook ở phase này.
- **Derive isCompleted**: logic phải chạy trong cùng 1 transaction/upsert để tránh race khi 3 request gần nhau → dùng upsert + đọc lại trong 1 hàm, chấp nhận đơn giản (KISS) vì sticky + idempotent.
