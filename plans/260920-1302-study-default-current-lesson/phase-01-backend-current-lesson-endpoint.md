---
phase: 1
title: Backend current-lesson endpoint
status: completed
priority: P2
effort: 1h
dependencies: []
---

# Phase 1: Backend current-lesson endpoint

## Overview

Thêm `GET /daily-session/current-lesson` trả bài chưa hoàn thành đầu tiên của user trong course đang học — phiên bản select nhẹ của logic `findNextLesson`, để frontend `/study` pre-select mà không tải conversations.

## Requirements

- Functional: JWT-required; response `{ lessonId: string | null, lessonTitle: string | null, order: number | null, courseId: string | null }` — null khi hết bài/chưa có course.
- Non-functional: không đổi behavior các endpoint hiện có; `npm run build` + test pass.

## Architecture

`DailySessionService.getCurrentLesson(userId)`:
1. `resolveActiveCourseId()` (tái dùng nguyên văn)
2. Query lesson đầu chưa hoàn thành với **select** `{ id, title, order, courseId }` — KHÔNG include conversations. Refactor nhỏ: `findNextLesson(userId, courseId, includeConversations = true)` nhận cờ, hoặc private helper `findFirstOpenLesson(userId, courseId, args)` dùng chung where-clause; chọn cách ít dup nhất.
3. Map DTO, null-safe.

Controller: `@Get('current-lesson')` trong `DailySessionController` (đã có JwtAuthGuard ở module — kiểm tra guard hiện tại của controller và theo đúng pattern đó).

## Related Code Files

- Modify: `backend/src/daily-session/daily-session.service.ts`, `daily-session.controller.ts`, `dto/daily-session.dto.ts`, `daily-session.service.spec.ts`

## Implementation Steps

1. DTO: thêm `CurrentLessonDto` (4 field nullable).
2. Service: `getCurrentLesson(userId)` theo Architecture trên; giữ `findNextLesson` cũ nguyên behavior cho `getDailySession`.
3. Controller: thêm route GET theo pattern route hiện có.
4. Spec: thêm test — (a) có lesson chưa xong → trả lesson đầu theo order; (b) tất cả đã xong → null; (c) mock `resolveActiveCourseId` trả null → null. Bám style mock Prisma hiện có trong spec.
5. `cd backend && npm run build` + `npm test` (scope daily-session) pass.

## Success Criteria

- [ ] `GET /daily-session/current-lesson` trả đúng DTO, JWT required
- [ ] 3 test case pass
- [ ] Build + test pass, không đổi behavior endpoint cũ

## Risk Assessment

Thấp — thêm read-only endpoint. Chú ý duy nhất: không phá signature `findNextLesson` hiện có.
