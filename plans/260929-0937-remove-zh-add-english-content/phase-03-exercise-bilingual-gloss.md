---
phase: 3
title: Bài tập song ngữ gloss
status: completed
priority: P2
effort: 6h
dependencies: []
---

# Phase 3: Bài tập song ngữ (gloss)

## Overview

Thêm gloss English cho bài tập sách bài tập (~870 mục): dịch `vi → en` vào JSON nguồn, re-import, renderers hiển thị gloss song ngữ.

## Requirements

- Functional: gloss bài tập hiển thị theo `language-preference` (vi/en/both); `DRILL_TYPE_LABELS` theo i18n.
- Non-functional: re-import idempotent, giữ nguyên ảnh/audio đã upload; build pass.

## Architecture

- Gloss `vi` nằm TRONG `Exercise.payload` (cột `Json`). Thêm field `en` song song `vi` trong JSON nguồn → importer lưu nguyên payload → `en` chảy vào DB **tự động**, KHÔNG đổi schema/validator/importer.
- Instruction KHÔNG cần `instructionEn` (i18n `exercises.instr.*` đã đủ 12/12 typeCode; `instructionVi` là fallback chết).
- Renderers thêm dòng nghĩa theo preference; tái dùng `language-preference-store`. Lưu ý `hanzi_guess_meaning_picture` (đoán nghĩa theo tranh) KHÔNG hiện gloss — gloss chính là đáp án, hiện ra sẽ spoil.

## Related Code Files

- Create (ngoài repo): `content-source/tools/translate-workbook-gloss.py` (Gemini)
- Modify: `content-source/extracted-wb/lesson-01..15.json` (thêm field `en`)
- Modify: `frontend/src/api/exercises-api.ts` (thêm `en` vào `ExerciseItem`/`ExerciseExample`/`OptionText`)
- Modify: `frontend/src/components/exercises/exercise-types.ts` (thêm `en`)
- Modify: `frontend/src/components/exercises/text-options-body.tsx`, `tf-judge-body.tsx`, `picture-pool-body.tsx`, `pinyin-pair-body.tsx`, `radical-groups-body.tsx` (hiển thị gloss)
- Modify: `frontend/src/components/exercises/drill-and-stroke-order-bodies.tsx` (`DRILL_TYPE_LABELS` → i18n)
- Modify: `frontend/src/i18n/locales/vi.json`, `en.json` (thêm key drill type + gloss label)

## Implementation Steps

1. Script dịch (content-source): đọc `lesson-NN.json`, với mỗi `payload[].vi`/`example[].vi`/`options[].vi` → LLM sinh `en` (sửa luôn `vi` hỏng), xuất file review `translation-review/lesson-NN.en.json` (cặp vi→en).
2. User review → script merge `en` vào `lesson-NN.json` (giữ nguyên cấu trúc).
3. Re-import: `npm run import:workbook -- --file lesson-NN.json` (15 bài, idempotent).
4. Frontend types: thêm `en?: string` vào `ExerciseItem`/`ExerciseExample`/`OptionText` (`exercises-api.ts`, `exercise-types.ts`).
5. Renderers: thêm dòng gloss theo `language-preference` (defensive — field optional); dùng 1 component `GlossText` dùng chung (DRY) thay vì lặp ở từng renderer.
6. `drill-and-stroke-order-bodies.tsx`: bỏ `DRILL_TYPE_LABELS` hardcode VN → i18n key `exercises.drill.*` (thêm vào `vi.json`/`en.json`).
7. Build + verify UI: chọn EN → gloss hiển thị English; drill label theo ngôn ngữ.

## Success Criteria

- [ ] 15 lesson JSON có `en`; re-import giữ nguyên ảnh/audio; `en` tồn tại sau re-import.
- [ ] Gloss hiển thị đúng vi/en/both theo preference ở mọi renderer áp dụng (trừ `hanzi_guess_meaning_picture`).
- [ ] `DRILL_TYPE_LABELS` theo i18n (hết tiếng Việt hardcode).
- [ ] Build pass.

## Risk Assessment

- Mỗi typeCode có shape khác → thêm gloss phải defensive (field optional), không phá layout (grid 2 cột, nút letter). Dùng `GlossText` chung giảm lặp.
- Re-import xóa media nếu JSON thiếu file → importer đã best-effort (warning, không chặn) — kiểm tra ảnh/audio còn sau re-import.
- 7 renderer cần sửa → rủi ro sót; grep `.vi`/`en` trong `components/exercises/` để rà.
