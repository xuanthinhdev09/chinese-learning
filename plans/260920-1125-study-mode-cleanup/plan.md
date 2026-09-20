---
title: 'Dọn dẹp mode ôn tập /study: giữ Flashcard + Quiz'
description: >-
  Cắt 2 mode giả (Fill Blank, Pinyin Match) đang gãy; Quiz ghi SM-2 progress
  (đúng=5, sai=1); fix nút "Ôn tập từ đến hạn" vào thẳng session flashcard
status: completed
priority: P2
branch: main
tags:
  - frontend
  - vocabulary
  - sm2
blockedBy: []
blocks: []
created: '2026-09-20T04:42:01.174Z'
createdBy: 'ck:plan'
source: skill
---

# Dọn dẹp mode ôn tập /study: giữ Flashcard + Quiz

## Overview

Tại `/vocabulary/study` hiện có 4 mode nhưng chỉ Flashcard là hoàn chỉnh: Quiz chạy được nhưng không ghi progress; Fill Blank và Pinyin Match gãy (kẹt ở từ đầu, không feedback, câu hỏi/distractor mock). Nút "Ôn tập từ đến hạn" ở `/vocabulary/review` cũng vô hiệu (chỉ đưa về picker).

Plan này: (1) cắt 2 mode giả, (2) nối Quiz vào SM-2 với mapping đơn giản đúng=quality 5 / sai=quality 1, (3) sửa flow ôn due vào thẳng flashcard qua URL param `due=1`.

Context: [brainstorm report](../reports/from-brainstormer-to-planner-study-mode-cleanup-260920-1125-report.md) — thiết kế đã user duyệt (cắt còn Flashcard+Quiz, mapping đơn giản, vào thẳng session ôn).

Quy ước chung mọi phase:
- Backend KHÔNG đổi — đã đủ endpoint SM-2 (`POST /vocabulary/progress`, `GET due`, `GET stats`)
- Mỗi phase xong: `cd frontend && npm run build` (tsc + vite) pass
- i18n sửa đồng bộ cả 3 locale `vi.json` / `en.json` / `zh.json`
- Không đổi `/today` (đang hoạt động đúng)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Cut fake quiz modes](./phase-01-cut-fake-quiz-modes.md) | Completed |
| 2 | [Quiz SM-2 progress](./phase-02-quiz-sm-2-progress.md) | Completed |
| 3 | [Fix due review flow](./phase-03-fix-due-review-flow.md) | Completed |

## Dependencies

- Không có plan nào đang dở chặn plan này (2 plan gần nhất: i18n 260920-0753, daily-session 260907-0949 — đều completed).
- Phase 2 và 3 phụ thuộc Phase 1 (study page đã dọn state thừa thì sửa đỡ xung đột).

## Acceptance Criteria (toàn plan)

1. `/study` chỉ còn 2 nút Flashcard + Quiz; zero reference sót tới `fill-blank`/`pinyin-match` (grep trắng).
2. Trả lời quiz → `recordProgress` gọi với quality đúng (đúng=5, sai=1) → stats dueToday thay đổi.
3. Bấm "Ôn tập từ đến hạn" → vào thẳng flashcard ~20 từ due, không qua picker.
4. Build + typecheck pass.

## Rủi ro

- Đúng = quality 5 → từ mới nhảy interval xa, due giảm nhanh → quan sát 1 tuần, đổi mapping nếu cần (1 dòng).
- Keys i18n dùng chung (`vocabulary.common.*`) phải rà chỗ khác dùng trước xóa.
