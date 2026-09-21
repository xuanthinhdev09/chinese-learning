---
phase: 2
title: "DB Schema & Migration"
status: completed
priority: P1
effort: "2h"
dependencies: ["phase-01-probe-workbook-type-catalog"]
---

# Phase 2: DB Schema & Migration

## Overview

Thêm 2 model `Exercise` + `ExerciseImage` vào Prisma schema — polymorphic, gắn Lesson hiện có. Không đụng bảng cũ. Migration chạy trên DB dev qua tunnel.

## Requirements

- Functional: lưu đề per 题型 (payload JSONB), ảnh crop serve được qua backend, re-import idempotent
- Non-functional: không breaking change với dữ liệu hiện có; index tối thiểu phục vụ query per-lesson

## Architecture

```
Exercise      { id, lessonId FK→Lesson, order Int,
                section String            // "听力" | "读写" | "写字" ... (từ catalog)
                typeCode String,          // key workbook-type-catalog.json
                instructionHanzi String?, instructionVi String?,
                payload Json              // đề verbatim + items[] + answer + {imageIds[], tts}
              }
ExerciseImage { id, lessonId FK, exerciseId FK?, filePath String,
                page Int?, cropBox Json?  // [x, y, w, h] dpi gốc lúc crop
              }
```

- Resolve bài tập theo `(lessonId, order)`; re-import = delete exercises per lesson + recreate (mẫu conversations replace trong `TextbookV2Importer` — không có user data đụng vào exercise ở phase này)
- `payload Json` là Prisma `Json` type; typing thật nằm ở tầng validator (Phase 4), không phải DB
- `filePath` ảnh pattern TTS storage: thư mục cấu hình `EXERCISE_IMAGE_STORAGE_DIR`, path tương đối lưu DB, serve qua controller (Phase 4 hoặc để UI phase sau — CLI import chỉ cần ghi path)

## Related Code Files

- Modify: `backend/prisma/schema.prisma` (+2 model, +relation `exercises Exercise[]` / `exerciseImages ExerciseImage[]` trên Lesson)
- Create: `backend/prisma/migrations/<timestamp>_add_workbook_exercise_tables/migration.sql` (qua `prisma migrate dev`)
- Modify: `backend/prisma/seed.ts` nếu có tham chiếu Lesson relation (check)

## Implementation Steps

1. Sửa `schema.prisma` thêm 2 model + relations (onDelete: Cascade theo Lesson, khớp pattern hiện có)
2. `npx prisma migrate dev --name add_workbook_exercise_tables` (tunnel DB dev phải đang chạy)
3. `npx prisma generate`
4. Build backend đảm bảo compile: `npm run build` (không code nào dùng model mới — chỉ verify generate ok)
5. Ghi chú tên storage dir env vào `.env.example` nếu repo có file này

## Success Criteria

- [x] Migration áp dụng sạch trên DB dev (`prisma migrate deploy` — migrate dev bị chặn non-interactive)
- [x] Bảng cũ nguyên vẹn
- [x] `npm run build` backend pass
- [x] Schema comment giải thích payload JSONB thuộc quyền validator per-typeCode

## Outcome (sync-back 21/09)

Thêm migration thứ 2 cùng ngày: `20260921160000_add_exercise_image_file_path_unique` — unique `@@unique([lessonId, filePath])` phục vụ upsert idempotent của importer. `cropBox` giữ cột nullable (luôn null) sau pivot bỏ crop — ảnh user tự upload qua UI.

## Risk Assessment

- Tunnel DB chưa chạy → migration fail: bật tunnel trước (runbook gitignored cục bộ, port 5433)
- Migration drift với DB VPS prod: phase này chỉ áp dev; prod chạy migrate khi deploy batch (Phase 5)
