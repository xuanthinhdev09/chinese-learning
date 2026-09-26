---
title: "Unified Lesson Learning Flow (3-stage unlock)"
description: "Bỏ 3 nút nav, trang chủ chỉ còn 'bắt đầu học' → 2 option (khuyến nghị / tự chọn). Mỗi lesson học qua wizard 3 giai đoạn (từ vựng → luyện nghe → exercises), đủ 3 mới mở lesson kế tiếp."
status: completed
priority: P1
branch: "main"
tags: [frontend, backend, prisma, learning-flow]
blockedBy: []
blocks: []
created: "2026-09-25T03:52:28.292Z"
createdBy: "ck:plan"
source: skill
---

# Unified Lesson Learning Flow (3-stage unlock)

## Overview

Thay cấu trúc điều hướng gây rối (3 nút header: Hôm nay / Trình độ HSK / Từ Vựng) bằng 1 luồng học lesson thống nhất 3 giai đoạn. Trang chủ chỉ còn 1 hành động "bắt đầu học" mở ra 2 lựa chọn. Mở khóa lesson kế tiếp khi hoàn thành đủ 3 hoạt động (từ vựng + luyện nghe + exercises) — thay cho cơ chế 1 flag `isCompleted` hiện tại.

**Nguồn thiết kế:** [brainstorm report](../reports/brainstorm-unified-lesson-flow-260925-1009-lesson-learning-redesign-report.md)

## Key decisions (đã chốt với user)

| Quyết định | Giá trị |
|---|---|
| Cấu trúc luồng | Wizard thống nhất 1 trang, stepper 3 bước |
| Mô hình mở khóa | 3 flag riêng (`vocabCompletedAt`/`dialogueCompletedAt`/`exercisesCompletedAt`), đủ 3 → `isCompleted` |
| Xong từ vựng | Flashcard → quiz ép tuần tự, xong cả 2 |
| Xong luyện nghe | Pass 1 lượt shadowing |
| Xong exercises | Checkable chấm hết; view-only (nghe/đọc) mở là xong |
| Tự chọn bài | Cùng luồng 3 giai đoạn, user chọn bài (tôn trọng lock) |
| Route cũ | Ẩn khỏi nav, giữ route |
| SRS / /today | Tách "ôn tập" riêng trên trang chủ; /today thành legacy |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend completion model](./phase-01-backend-completion-model.md) | Completed |
| 2 | [Lesson wizard](./phase-02-lesson-wizard.md) | Completed |
| 3 | [Navigation and homepage](./phase-03-navigation-and-homepage.md) | Completed |
| 4 | [Entry points and wiring](./phase-04-entry-points-and-wiring.md) | Completed |

## Dependencies

- Không có plan nào block plan này. Plan `260921-1015-workbook-exercise-scan-pipeline` (in-progress) là công việc **content** exercises độc lập — plan này dùng `Exercise` model có sẵn, không phụ thuộc output của nó.
- Thứ tự nội bộ: Phase 1 → 2 → 3 → 4 (2 phụ thuộc 1, 4 phụ thuộc 2+3).

## Testing strategy (--tdd)

- **Backend (Jest có sẵn):** viết test thất bại trước → implement → test xanh. Phủ: `activity-complete` (3 flag, derive isCompleted, lỗi), lock tuần tự không đổi, admin bypass không đổi.
- **Frontend (không có test framework):** tách logic auto-detect hoàn thành ra pure helper module (testable sau này nếu thêm infra); hiện verify bằng `npx tsc --noEmit` + QA thủ công.

## Success criteria (tổng)

- Trang chủ chỉ hiện "bắt đầu học" + "ôn tập", không còn 3 nút nav.
- "Học ngay" hiện đúng 2 option (khuyến nghị / tự chọn).
- Khuyến nghị: từ vựng → luyện nghe → exercises, đủ 3 → mở lesson kế.
- Tự chọn: chọn bài (bài khóa disabled), chạy đúng luồng 3 giai đoạn.
- Lock tuần tự + admin bypass vẫn đúng.

## Validation Log

### Verification Results

- Claims checked: ~15 (model, endpoints, components, paths, API exports)
- Verified: 14 | Failed: 1 | Unverified: 0
- Tier: Standard (4 phases)
- Failure: i18n path ghi sai `frontend/src/locales/*` — thực tế `frontend/src/i18n/locales/{en,vi,zh}.json` (đã sửa ở phase-03).

### Validation Decisions (260925-1048)

1. Exercises "xong": câu có nút kiểm tra phải chấm hết; câu chỉ nghe/đọc (stroke order, drill) tính xong khi mở.
2. Stage từ vựng ép tuần tự flashcard → quiz.
3. Thêm `GET /daily-session/lesson-status` để khôi phục tiến độ 3 giai đoạn khi reload.
4. Route lesson cũ `/lessons/:order` + `/lessons/:order/exercises` redirect về `/learn/:id`.

### Post-Review Fixes (260925-1400)

Sau `code-reviewer` + `tester`, 3 sửa:

1. **Dialogue pass-gate** — `handleDialogueDone` chỉ `markDone('dialogue')` khi `passed === true`. "Chưa trôi" vẫn ghi SRS nhưng không mở khóa — đúng quyết định "Xong luyện nghe = pass 1 lượt".
2. **Legacy isCompleted** — seed effect tôn trọng `isCompleted`: bài hoàn thành theo luồng cũ `/today` (flags null, isCompleted=true) hiện banner thay vì mở lại stage 0.
3. **Xóa dead code** — `isVocabStageComplete` + `VocabStageState` không ai gọi, đã xóa khỏi `completion-detection.ts`.

**Giữ nguyên (đã đánh giá, không sửa):** view-only tautology (hệ quả đúng của "mở là xong"); zero-exercise auto-complete (mong muốn cho L3-15 chưa có exercises, tự hồi phục khi pipeline thêm bài).

### QA Follow-up (260926)

- **Bỏ khóa tuần tự giữa 3 stage** — user chốt "chọn tự do 3 stage" (26/09): mọi stage bấm được, học thứ tự nào cũng được; vẫn cần đủ 3 để mở bài kế (backend derive `isCompleted`). Xóa prop `locked` khỏi `StageStepper`.
- **Fix i18n stepper** — `StageStepper` render `t(stage.label)` thay vì raw key `learn.stage.*`.
- **i18n luồng tự chọn** đã kiểm tra đủ vi/en/zh (chooser/review/hsk/lesson/learn) — không thiếu key.
- **Bỏ chooser khuyến nghị/tự chọn (26/09)** — 2 option cùng dẫn vào 1 luồng 3-stage giống hệt nên thừa. Hero "bắt đầu học" giờ `navigate('/hsk')` trực tiếp; xóa modal chooser + state `chooserOpen`/`currentLesson` + `getCurrentLesson` khỏi `dashboard-page.tsx`; xóa key `dashboard.chooser.*` ở vi/en/zh.
