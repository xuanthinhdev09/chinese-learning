---
title: Default phạm vi học theo bài đang học /study
description: >-
  GET /daily-session/current-lesson trả bài chưa hoàn thành đầu tiên của user;
  /study tự pre-select level + chip bài đang học khi user chưa chọn gì
status: completed
priority: P2
branch: main
tags:
  - backend
  - frontend
  - vocabulary
blockedBy: []
blocks: []
created: '2026-09-20T06:19:49.077Z'
createdBy: 'ck:plan'
source: skill
---

# Default phạm vi học theo bài đang học /study

## Overview

Hiện tại `/vocabulary/study` mặc định học tất cả từ của level khi user không chọn chip bài. Plan này thêm endpoint `GET /daily-session/current-lesson` (bài đầu chưa hoàn thành — tái dùng `findNextLesson`) và frontend tự pre-select level + chip bài đang học khi mở trang, trước khi user kịp chọn.

Context: [brainstorm report](../reports/from-brainstormer-to-planner-study-default-current-lesson-260920-1302-report.md) — 3 quyết định user chốt: pre-select tự động; định nghĩa = bài chưa hoàn thành đầu tiên (nhất quán với "Bài mới" ở `/today`); áp dụng cả Flashcard + Quiz.

Quy ước chung:
- Tái dùng `findNextLesson` + `resolveActiveCourseId` — KHÔNG viết logic xác định bài mới
- Fallback an toàn: mọi đường lỗi/null → hành vi cũ (default "Tất cả từ vựng")
- Phase 1 xong: `cd backend && npm run build` + test pass; Phase 2 xong: `cd frontend && npm run build` pass

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend current-lesson endpoint](./phase-01-backend-current-lesson-endpoint.md) | Completed |
| 2 | [Frontend pre-select current lesson](./phase-02-frontend-pre-select-current-lesson.md) | Completed |

## Dependencies

- Phase 2 phụ thuộc Phase 1 (frontend gọi endpoint mới).
- Không chặn/với plan nào khác (plan 260920-1125 study-mode-cleanup đã completed).

## Acceptance Criteria (toàn plan)

1. Mở `/study` chưa bấm gì → course đang học + chip bài đang học chọn sẵn; bấm Flashcard hoặc Quiz → học đúng bài đó
2. Chọn tay ("Tất cả" / bài khác / level khác) ghi đè pre-select
3. User mới → pre-select bài 1; học xong hết → fallback hành vi cũ
4. Backend test + build pass, frontend build pass

## Rủi ro

- Race pre-select vs user click → guard chỉ set khi `selectedLevel === null`
- `findNextLesson` hiện include conversations → cần biến thể select nhẹ
