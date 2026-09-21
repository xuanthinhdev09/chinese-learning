# Brainstorm: Pipeline scan Sách bài tập → dữ liệu Exercise trong app

**Date:** 21/09/2026 · **Status:** ĐÃ CHỐT (user duyệt Hướng A) · **Next:** /ck:plan

## Problem

HSK2 Sách bài tập.pdf (169 trang, scan ảnh, không text layer — `C:/My Work/chinese-learning/content-source/pdf/`) cần trở thành bài tập thật trong app: đề verbatim, đủ ảnh (nếu đề có), bài nghe bằng Azure TTS. Logic làm bài giữ đúng dạng đề từng 题型 của sách.

## Requirements đã chốt (AskUserQuestion 21/09)

| Hạng mục | Quyết định |
|---|---|
| Đầu ra đợt này | **Pipeline + DB trước** — schema + trích xuất + import JSON v3. UI làm bài tập = phase sau |
| Bài nghe | **Azure TTS đọc câu** — dùng provider `azure-rest` có sẵn, cache `TtsAudio`, on-demand khi làm bài (không pre-synthesize lúc import) |
| Ảnh trong đề | **Crop thủ công có tool**: render dpi cao → ghi `cropBox` tay vào JSON → script xuất PNG |
| Trung thành sách | **Giữ đúng dạng đề từng 题型** — mỗi dạng 1 `typeCode`, đề verbatim |
| Gắn dữ liệu | **Exercise thuộc Lesson hiện có** của course HSK2 (theo courseId+order) |
| Lưu ảnh | **Disk backend + endpoint serve** (pattern TTS storage), không commit git |
| Nhịp | **Pilot 1-2 bài khép kín** → chốt catalog 题型 → batch 15 bài |

## Approaches đã đánh giá

- **A — Polymorphic (CHỌN):** 1 bảng `Exercise` + `ExerciseImage`, payload JSONB per 题型, validator per-type ở tầng import. Thêm 题型 không cần migration. Khớp cấu trúc sách: 1 đề = prompt chung (ảnh/audio) + nhiều 小题 trong 1 payload.
- **B — Chuẩn hoá per-dạng (loại):** 5-7 bảng + joins, thêm 题型 = migration. YAGNI vi phạm, đảo chiều kém khi chưa có UI.
- **C — Hybrid Group/Item bảng riêng (loại):** 小题 không bao giờ query độc lập → over-engineering.

## Thiết kế chốt

### Schema (migration mới, không đụng bảng cũ)

```
Exercise      { id, lessonId FK, order Int, section String   // 听力 | 读写 | 写字... (từ probe)
                typeCode String,                              // key trong workbook-type-catalog.json
                instructionHanzi String?, instructionVi String?,
                payload Jsonb }                               // đề verbatim + items[] + đáp án + {imageIds[], tts{text,voices,speed}}
ExerciseImage { id, lessonId FK, exerciseId FK?, filePath, page Int?, cropBox Jsonb? }
```

- Catalog 题型 = artifact của pilot: `content-source/reference/workbook-type-catalog.json` (typeCode, mô tả, payload schema, answer shape, UI hint sau này)
- Validator per-typeCode trong backend (mở rộng pattern `JsonV2Validator`)
- Chấm bài: đáp án đúng nằm trong payload → chấm client/server không cần thêm dữ liệu

### Pipeline (mở rộng `docs/textbook-scan-extraction-workflow.md`)

1. Render 169 trang (`render/ocr_full_wb/`) → OCR.space batch (`ocrspace_cache_wb/`) — tái dùng `tools/ocrspace_batch_driver.py`
2. Probe mục lục + quét 题型 thật → `workbook-type-catalog.json` (chưa probe — KHÔNG khẳng định danh sách dạng bài trước pilot; dự đoán format chuẩn: nghe chọn tranh/đúng-sai, nối, chọn từ điền, sắp xếp câu, viết chữ — chỉ là giả thuyết)
3. Trích per-lesson verbatim → `content-source/extracted-wb/lesson-NN.json` (JSON v3: course→lessons→exercises[])
4. Crop ảnh: tool render dpi 300-500 vùng chỉ định → `exercise-images/`
5. Bài nghe: payload ghi text + voice roles → TTS endpoint on-demand
6. Ground truth đáp án: **chưa xác nhận sách có trang 答案 không** — probe; có thì OCR làm chuẩn, không thì tự giải khi trích + spot-check
7. Import: `WorkbookImporter` (pattern `TextbookV2Importer`: resolve lesson theo course+order, replace exercises per lesson, 1 transaction, warnings) + CLI `npm run import:workbook`
8. Verify: presence trong OCR cache, pypinyin chỗ sinh pinyin, đáp án ∈ tập lựa chọn, cross-check ảnh ↔ đề

### Touchpoints (file sẽ đụng)

- `backend/prisma/schema.prisma` — +2 model, 1 migration
- `backend/src/import/` — dto/validator/mapper/importer mới + controller endpoint upload (optional) 
- `backend/src/scripts/` — `import-workbook.ts` CLI
- `content-source/tools/` — fork driver cho workbook + crop tool mới
- `docs/textbook-scan-extraction-workflow.md` — bổ sung phần workbook khi xong pilot

## Risks

- **Catalog 题型 chưa biết chắc** → pilot là bước bắt buộc, schema v3 chỉ đóng sau pilot (đúng nhịp đã chốt)
- **Ảnh crop tốn công tay** — chấp nhận (15 bài); tool chỉ hỗ trợ render + export
- **Bản quyền BLCUP** — app cá nhân/private thì OK; KHÔNG public API/content bài tập
- **TTS đọc đề nghe không phải audio gốc sách** — user đã chấp nhận; đề nghe có role A/B dùng dialogue synthesis (đã hỗ trợ)

## Success metrics (pilot)

- Bài 1-2: 100% 题 trích đủ, đáp án đúng 100% sau spot-check, ảnh crop đúng khung, audio TTS play được toàn bộ câu nghe, import không warning nghiêm trọng
- Re-import idempotent (lesson giữ id, exercises replace sạch)

## Next steps

1. `/ck:plan` — phân phase: probe+mục lục → schema+catalog → pilot trích bài 1-2 → importer+CLI → verify → batch 15
2. UI làm bài tập: brainstorm riêng sau khi dữ liệu 15 bài đã trong DB
