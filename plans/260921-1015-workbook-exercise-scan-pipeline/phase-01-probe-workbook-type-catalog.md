---
phase: 1
title: "Probe Workbook & Type Catalog"
status: completed
priority: P1
effort: "3-4h"
dependencies: []
---

# Phase 1: Probe Workbook & Type Catalog

## Overview

Render + OCR toàn bộ 169 trang Sách bài tập HSK2, transcribe mục lục, probe từng bài để chốt **danh mục 题型 thật** của sách → `workbook-type-catalog.json`. Đây là artifact quyết định schema v3 — phase 2 không được bắt đầu khi catalog chưa chốt.

## Requirements

- Functional: bản đồ trang (lesson → pdf pages), danh sách section + 题型 per bài, xác nhận có/không trang 答案 (đáp án) cuối sách, map đề nghe ↔ track audio
- Non-functional: cache idempotent per trang (chạy lại không tốn), không dùng LLM cho khung dữ liệu
- Audio bài nghe là file user cung cấp tại `content-source/audio/hsk2/` (danh sách trong `audio-manifest.txt`) — phase này chỉ cần map track codes mà đề tham chiếu; file audio có thể đến sau

## Architecture

Tái dùng pipeline giáo khoa (B0-B2 trong `docs/textbook-scan-extraction-workflow.md`), thư mục riêng cho workbook:

```
content-source/
├── render/ocr_full_wb/page_NNN.jpg      # pymupdf dpi 150
├── ocrspace_cache_wb/page_NNN.txt       # OCR.space Engine 3, idempotent
└── reference/workbook-type-catalog.json # OUTPUT phase này
```

## Related Code Files

- Reuse: `C:/My Work/chinese-learning/content-source/tools/ocrspace_batch_driver.py` (thêm `--imgdir`/`--cache` param — script đã có sẵn 2 flags này)
- Create: `content-source/tools/probe_workbook_lessons.py` (dò loại trang, 1-line prompt qua vision nếu OCR text không đủ)
- Create: `content-source/reference/workbook-type-catalog.json`

## Implementation Steps

1. Render 169 trang: `python -c "import fitz; doc=fitz.open('pdf/HSK 2 Sách bài tập.pdf'); [doc[i].get_pixmap(dpi=150).save(f'render/ocr_full_wb/page_{i:03d}.jpg') for i in range(len(doc))]"`
2. OCR.space batch: `python tools/ocrspace_batch_driver.py --pages 0-168 --imgdir render/ocr_full_wb --cache ocrspace_cache_wb` (fail rải rác là thường — chạy lại run 2)
3. Transcribe mục lục từ cache (trang đầu sách) → bản đồ lesson → pdf pages (calibration `pdf_index = book_page - 1` cần verify lại trên sách này)
4. Quét trang cuối: có 答案 (đáp án) không → quyết định ground-truth đáp án ở Phase 3
5. Probe 2-3 trang đầu mỗi bài: nhận diện section (听力/读写/写字...) + 题型 (OCR text + vision 1-line prompt khi cần). Ghi per bài: danh sách đề, mỗi đề có ảnh không, có đề nghe không
6. Chuẩn hoá → `workbook-type-catalog.json`:

```json
{
  "_source": "probe 21/09/2026, sách bài tập HSK2 169 trang",
  "answer_key_pages": {"present": false, "pdf_pages": []},
  "sections": ["听力", "读写", "写字"],
  "exercise_types": [
    {"typeCode": "listen_choose_picture", "section": "听力",
     "prompt": "nghe câu, chọn 1/3 tranh",
     "has_image": true, "has_audio": true,
     "payload_schema": {"items": [{"imageId": "ref", "audioFile": "01-1.mp3", "answer": "A|B|C"}]},
     "answer_shape": "letter per item"}
  ],
  "lesson_map": {"1": {"pdf_pages": [12, 22], "exercises": [{"num": 1, "typeCode": "...", "page": 12}]}},
  "calibration": "pdf_index = book_page - 1 (verify trước khi tin)"
}
```

7. Verify calibration: đối chiếu 2-3 trang bài đã biết với số trang in

## Success Criteria

- [ ] ~~169/169 trang có ảnh render + OCR cache~~ — BỎ (pivot 21/09): không render-all; batch phase 5 probe per bài khi trích
- [ ] Bản đồ 15 bài đầy đủ pdf_pages — chỉ map L1; còn lại làm dần trong batch (phase 5)
- [x] Catalog liệt kê 题型 gặp thật — 12 typeCodes chốt từ L1 (thay vì probe 15 bài trước), lưu dạng TS const `TYPE_CODES` trong `backend/src/import/workbook/json-v3.validator.ts`; typeCode mới khi gặp ở batch = thêm const + test
- [x] Trả lời được: có trang 答案 không → KHÔNG dùng trang đáp án in; ground truth = answer key user paste per bài (`content-source/answer-keys/lesson-NN.json`)
- [x] Mỗi typeCode có payload_schema + answer_shape — enforce bởi validator (11 unit tests)

## Outcome (sync-back 21/09)

Phase chạy khác thiết kế do pivot user: trích L1 trực tiếp bằng vision band-crop (không render/OCR 169 trang trước). Catalog đóng cửa với L1 dưới dạng TS const thay vì `workbook-type-catalog.json`. Sections thật của sách bài tập: 听力 / 阅读 / 语音 / 汉字 (khác dự đoán 读写/写字).

## Risk Assessment

- OCR.space fail nhiều trang (đã thấy 88/145 ở sách giáo khoa run 1) → chạy lại idempotent; trang OCR trống → vision probe trực tiếp
- Mục lục sách bài tập có thể không in số trang bài → dò thủ công probe trang, chấp nhận tốn thời gian phase này
