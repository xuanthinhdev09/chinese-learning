---
title: "Workbook Exercise Scan Pipeline (Sach bai tap → Exercise DB)"
description: "Scan 169 trang sách bài tập HSK2 thành bài tập thật trong app: catalog 题型, schema Exercise polymorphic, pilot 1-2 bài, importer CLI, batch 15 bài. Bài nghe dùng Azure TTS có sẵn."
status: in-progress
priority: P2
branch: "main"
tags: [feature, backend, database, content-pipeline]
blockedBy: []
blocks: []
created: "2026-09-21T03:33:33.297Z"
createdBy: "ck:plan"
source: skill
---

# Workbook Exercise Scan Pipeline (Sach bai tap → Exercise DB)

## Overview

Mở rộng pipeline trích xuất đã chứng minh (`docs/textbook-scan-extraction-workflow.md`) cho **Sách bài tập** HSK2 (169 trang scan ảnh, `C:/My Work/chinese-learning/content-source/pdf/HSK 2 Sách bài tập.pdf`). Đầu ra đợt này: **dữ liệu bài tập nạp đủ vào DB** — đề verbatim giữ đúng dạng từng 题型, ảnh crop từ trang scan, bài nghe dùng file audio gốc do user cung cấp (`content-source/audio/hsk2/`). **UI làm bài tập là phase sau, ngoài phạm vi.**

Thiết kế chốt (brainstorm 21/09, user đã duyệt):
- Schema polymorphic: `Exercise` (payload JSONB per typeCode) + `ExerciseImage` — gắn Lesson hiện có của course HSK2
- Nhịp: probe → chốt catalog → pilot bài 1-2 khép kín → batch 15 bài
- Bài nghe: **audio gốc do user cung cấp** (đổi ý 21/09 so với TTS ban đầu) — file đặt tại `content-source/audio/hsk2/`, danh sách paste vào `audio-manifest.txt`; đề nghe payload tham chiếu tên file audio, importer copy vào storage backend serve qua endpoint
- Ảnh: crop thủ công có tool (cropBox tay trong JSON → script xuất PNG), disk backend + endpoint serve

## Context

- Brainstorm report: `plans/reports/from-brainstormer-to-planner-workbook-exercise-scan-260921-1015-report.md`
- Workflow gốc: `docs/textbook-scan-extraction-workflow.md` (pipeline giáo khoa, tools ở `C:/My Work/chinese-learning/content-source/tools/`)
- Plan nền (done): `plans/260907-0949-daily-session-content-pipeline/` — importer v2, DialogueProgress, TTS module
- DB: VPS 91.99.69.228 qua ssh tunnel local 5433→5432 (runbook gitignored cục bộ)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Probe Workbook & Type Catalog](./phase-01-probe-workbook-type-catalog.md) | Completed (superseded scope) |
| 2 | [DB Schema & Migration](./phase-02-db-schema-migration.md) | Completed |
| 3 | [Pilot Extraction Lessons 1-2](./phase-03-pilot-extraction-lessons-1-2.md) | In-progress (L1 done, L2 chờ answer key) |
| 4 | [Importer CLI & Validators](./phase-04-importer-cli-validators.md) | Completed (scope + UI upload) |
| 5 | [Verify & Batch Import 15 Lessons](./phase-05-verify-batch-import-15-lessons.md) | Pending (chờ answer key per bài) |

## Dependencies

- Không block plan nào; xây trên outputs của plan `260907-0949` (đã done): schema Course/Lesson, `TextbookV2Importer`, TTS module
- Phase 2 (schema) chỉ đóng cứng SAU khi Phase 1 chốt catalog — Phase 3 pilot mới là bước xác thực schema thật

## Key decisions (đã duyệt, đừng hỏi lại)

1. Hướng A polymorphic — 1 bảng Exercise + ExerciseImage, KHÔNG tách bảng per dạng
2. Bài nghe = audio gốc user cung cấp (`content-source/audio/hsk2/` + `audio-manifest.txt`) — **đổi ý 21/09**, bỏ phương án Azure TTS cho đề nghe sách (TTS vẫn dùng cho flashcard/đoạn thoại hiện có, không liên quan phase này)
3. Ảnh = crop tay có tool, KHÔNG dò khung tự động
4. Giữ đề verbatim per 题型, KHÔNG chuẩn hoá interaction
5. Pipeline + DB trước, UI sau
6. Nội dung sách bản quyền BLCUP — app private, không public API content này

## Validation Log

### Verification Results (session 21/09)
- Claims checked: 7 (inline, code đọc trực tiếp trong session)
- Verified: 7 | Failed: 0 | Unverified: 0
- Tier: Full theo số phase (5), thực hiện inline vì plan viết từ code đã đọc cùng session
- Đã xác minh: `TTS_STORAGE_DIR` pattern (`tts-storage.service.ts:33`); guard/Public pattern có sẵn (`import/tts/hsk.controller`); driver OCR.space có `--imgdir/--cache`; `import-v2.spec.ts` làm mẫu test; `import:textbook` script (`backend/package.json:24`); schema Lesson chưa có relation exercise; cấu trúc `content-source/tools/`

### Interview Decisions (session 21/09, 4 câu)
1. **Re-import vs progress tương lai:** Replace-all, progress phase sau tham chiếu `(lessonId, exercise order, item label)` — KHÔNG tham chiếu exercise id
2. **Prod timing:** Phase 5 import dev + prod luôn
3. **Audio thiếu khi import:** Warning, vẫn import; checklist bàn giao user补 file
4. **Thứ tự đề:** Exercise.order global per lesson theo thứ tự in của sách

### Whole-Plan Consistency Sweep (session 21/09)
- Fix: Overview plan.md còn nói "Azure TTS on-demand" → đã sửa thành audio user cung cấp (phần "Thiết kế chốt" + Key decisions đã đúng từ trước)
- Quét "TTS" toàn plan: còn lại chỉ là tham chiếu *pattern storage* (`tts-storage.service.ts` mẫu cho media dir) — hợp lệ, không mâu thuẫn
- Phase 1 catalog đã dùng `audioFile` (không còn `tts` trong payload_schema); Phase 3/4/5 nhất quán audio manifest
- Kết luận: 0 unresolved contradiction

### Execution Outcome (session 21/09, cook — pivot giữa buổi theo yêu cầu user)
1. **Bỏ crop workflow** (user: "không cần cắt ảnh đâu, tôi sẽ tự upload") — cropBox chỉ giữ cột nullable; image slot trong JSON chỉ còn `{ref, page, file, desc}`; user upload ảnh qua UI
2. **UI bài tập vào phạm vi** (user: "xây dựng UI exercise hoàn chỉnh, tại vị trí hiển thị ảnh thêm chức năng upload") — hoàn thành: backend exercises module + frontend 7 renderer/12 typeCodes + upload inline, see phase-04 Outcome
3. L1 khép kín: 12 đề / 27 slot / 35 đáp án khớp key / import dev OK / re-import idempotent (removed 0/0)
4. Gates: tester 96/96 pass; code-reviewer REQUEST-CHANGES → 1 BLOCKER + 2 MAJOR + 2 MINOR đã fix, re-verify sạch
5. Còn mở: L2-15 (chờ answer key user paste), upload ảnh thật qua UI, import prod (phase 5)
