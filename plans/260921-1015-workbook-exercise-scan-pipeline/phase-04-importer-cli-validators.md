---
phase: 4
title: "Importer CLI & Validators"
status: completed
priority: P1
effort: "4h"
dependencies: ["phase-02-db-schema-migration", "phase-03-pilot-extraction-lessons-1-2"]
---

# Phase 4: Importer CLI & Validators

## Overview

Backend: validator JSON v3 per typeCode + `WorkbookImporter` + CLI `npm run import:workbook`. Copy file ảnh/audio vào storage backend, serve qua endpoint. Pattern bám `TextbookV2Importer` + `JsonV2Validator` hiện có.

## Requirements

- Functional: import file v3 (1 lesson hoặc merge nhiều lesson) idempotent; ảnh/audio copy vào storage dir; endpoint serve file; lỗi validation liệt kê đủ `errors[]`/`warnings[]`
- Non-functional: file code < 200 lines (tách validator per nhóm typeCode nếu dài); không đụng code importer v2

## Architecture

```
POST body / CLI file: {course: {...}, lessons: [{order, exercises[], images[]}]}
WorkbookImporter (transaction per file):
  resolve lesson (courseId+order) → deleteMany Exercise + ExerciseImage per lesson
  → copy ảnh/audio: extracted-wb/exercise-images/** + content-source/audio/hsk2/*
    → EXERCISE_IMAGE_STORAGE_DIR / AUDIO_STORAGE_DIR (disk, pattern TtsStorageService)
  → insert Exercise (payload Json) + ExerciseImage
Serving: GET /exercises/images/:filePath, GET /exercises/audio/:filePath
  (loopback/auth-guard, KHÔNG public — nội dung bản quyền)
```

- `audioFile` trong payload = tên file tương đối trong audio storage; file thiếu khi import → warning, KHÔNG fail (user có thể补 audio sau, re-import idempotent)
- KISS: KHÔNG thêm controller upload wizard v3 — CLI là đủ cho phase này (UI làm bài phase sau mới cần API đọc)

## Related Code Files

- Create: `backend/src/import/validators/json-v3.validator.ts` (+ spec)
- Create: `backend/src/import/workbook-v3/workbook-v3.importer.ts` (+ spec)
- Create: `backend/src/import/mappers/json-v3.mapper.ts`
- Create: `backend/src/scripts/import-workbook-v3.ts`
- Modify: `backend/package.json` (+`import:workbook` script), `backend/src/import/import.module.ts` (nếu expose provider)
- Create: `backend/src/exercises/exercises-file.controller.ts` (serve ảnh/audio)

## Implementation Steps

1. DTO v3 (`import-workbook-v3.dto.ts`) + validator: course/lesson/exercise bắt buộc; per-typeCode check payload theo `payload_schema` của catalog (catalog shape hardcode thành TS const — không đọc JSON runtime)
2. Unit test validator: mỗi typeCode 1 case hợp lệ + 1 case gãy (theo mẫu `import-v2.spec.ts`)
3. `WorkbookImporter`: transaction, resolve lesson, replace exercises/images, copy media file (stream copy, idempotent theo tên file đích)
4. CLI `import-workbook-v3.ts` — output summary kiểu script v2 (per-lesson: exercises +N, images +N, audio missing count)
5. Controller serve file với auth guard + path traversal protection (resolve path phải nằm trong storage dir)
6. Pilot thật: import lesson-01/02 vào DB dev qua tunnel → query spot-check payload/ảnh/audio path
7. `npm run build` + test suite pass

## Success Criteria

- [x] Import bài 1 sạch, re-import lần 2 cho kết quả giống hệt (đã chạy thật: `exercises=12 images=27, removed: 0/0`)
- [x] Validator chặn đúng: sai typeCode, thiếu answer, imageRef không tồn tại → lỗi rõ (11 spec tests)
- [x] Ảnh/audio serve được qua endpoint có auth (smoke: 4/4 route → 401 không token); path traversal bị chặn (regex whitelist + resolve-in-root + spec adversarial)
- [x] Audio/ảnh thiếu file → warning (`audioMissingOnDisk`/`imagesMissingOnDisk`), import vẫn thành công
- [x] Unit test validator pass; build pass (96/96 tests, nest build + frontend tsc sạch)

## Outcome (sync-back 21/09 — scope mở rộng theo yêu cầu user)

Ngoài importer/validator/CLI như plan: user yêu cầu build luôn **UI làm bài tập + upload ảnh tại chỗ** (bỏ luồng crop). Bổ sung:
- `backend/src/exercises/` — ExercisesModule: GET lesson exercises, GET/POST image file (upload 5MB, mime↔ext match), GET audio; JWT guard toàn bộ, `@SkipThrottle` class + re-enable upload 30/min; StreamableFile; storage port `ExerciseMediaStorage` (env `EXERCISE_IMAGE_STORAGE_DIR`/`EXERCISE_AUDIO_STORAGE_DIR`)
- Frontend: `components/exercises/` (exercise-card dispatch 12 typeCodes → 7 renderer, image-slot upload inline, bits), `pages/lessons/lesson-exercises-page.tsx`, route `/lessons/:lessonId/exercises`, nút "Luyện bài tập" ở lesson detail; media fetch dạng blob qua react-query (img/audio không gửi được Authorization header); i18n vi/en/zh
- Upload flow sửa theo code review: `apiClient.postForm` (BLOCKER — post cũ JSON-stringify FormData), map `exerciseIdByOrder` trong importer (MAJOR — không phụ thuộc thứ tự mảng), object URL tạo trong `queryFn` (MAJOR — tránh leak mỗi render)

## Risk Assessment

- Payload JSONB gõ lệch giữa catalog và TS const → dùng 1 nguồn: viết TS const trước, sinh phần catalog JSON từ TS const khi cần đối chiếu
- Serve file tĩnh nhầm thành public → bắt buộc auth guard; nội dung sách bản quyền
