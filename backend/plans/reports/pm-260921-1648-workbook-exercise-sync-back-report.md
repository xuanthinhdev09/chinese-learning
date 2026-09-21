# PM Sync-back — Workbook Exercise Scan Pipeline

Date: 21/09/2026 16:48 · Plan: `plans/260921-1015-workbook-exercise-scan-pipeline/` · Branch: main

## Plan Status

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Probe Workbook & Type Catalog | Completed (superseded scope) | catalog = TS const 12 typeCodes, probe-all bỏ |
| 2 | DB Schema & Migration | Completed | 2 migrations áp dụng dev |
| 3 | Pilot Extraction L1-2 | In-progress | L1 100% (12 đề/27 slot/35 đáp án); L2 chờ answer key |
| 4 | Importer CLI & Validators | Completed | + scope: exercises module serve/upload + full UI |
| 5 | Verify & Batch Import 15 Lessons | Pending | chờ answer key per bài |

## Verified This Session

- Backend build sạch; **96/96 tests pass** (9 suites, gồm 18 test mới validator+storage); frontend tsc sạch; locale JSON hợp lệ
- Smoke endpoints (port 3100 — :3000 bị Docker Desktop chiếm): 4/4 route → 401 không token = module mount + JWT guard đúng
- Idempotency chạy thật: re-import L1 lần 2 → `exercises=12 images=27, removed: 0/0`
- Importer L1 vào dev DB: 12 Exercise + 27 ExerciseImage; audio 01-1/01-2 copied; 27 ảnh pending upload (thiết kế — user upload qua UI)

## Code Review Round

code-reviewer: REQUEST-CHANGES (1 BLOCKER, 2 MAJOR, 2 MINOR, 7 ADVISORY) → đã fix 7 mục (postForm multipart, importer exerciseIdByOrder, object-URL trong queryFn, Promise.all exists, upload error codes + i18n, audio cache 86400, radical default group đầu). Skip có lý do: import phi-transactional (re-run idempotent), roles (app 1 người), tách file ~210 dòng, ESLint config (gap có sẵn). Re-verify: build + 96/96 + tsc sạch.

## Pivots (user, 21/09)

1. Bỏ crop workflow → user tự upload ảnh qua UI
2. UI bài tập + upload inline vào phạm vi (trước là "phase sau")

## Next

1. User paste answer key "lesson 2:" → build lesson-02.json → import (đóng phase 3)
2. Batch L3-15 per answer key + import dev → prod (phase 5)
3. Upload ảnh thật L1 qua UI để user spot-check hiển thị

## Unresolved Questions

- None blocking.
