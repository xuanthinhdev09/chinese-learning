---
phase: 3
title: "Pilot Extraction Lessons 1-2"
status: in-progress
priority: P1
effort: "4-6h"
dependencies: ["phase-01-probe-workbook-type-catalog", "phase-02-db-schema-migration"]
---

# Phase 3: Pilot Extraction Lessons 1-2

## Overview

Trích xuất khép kín bài 1-2 theo catalog: JSON v3 per-lesson (đề verbatim), crop ảnh, tham chiếu audio. Pilot là bước xác thực catalog + schema v3 TRƯỚC khi viết importer và batch 15 bài — phát hiện 题型 lạ ở đây rẻ, ở batch thì đắt.

## Requirements

- Functional: 100% 题 bài 1-2 trích đủ, đáp án đúng sau spot-check, ảnh crop đúng khung, đề nghe có `audioFile` tham chiếu đúng manifest
- Non-functional: schema v3 chỉ đóng khi pilot xong; mọi sửa catalog/schema phải quay lại cập nhật artifact

## Architecture

```
content-source/
├── extracted-wb/lesson-01.json, lesson-02.json   # JSON v3 per-lesson
├── exercise-images/lesson-01/pXX-crop-N.png      # crop dpi gốc, tên mang trang
└── audio/hsk2/audio-manifest.txt                 # user paste danh sách (có thể chưa có lúc pilot)
```

JSON v3 per-lesson:
```json
{"lesson": {"order": 1, "book_page": 12,
  "exercises": [
    {"order": 1, "section": "听力", "typeCode": "listen_choose_picture",
     "instructionHanzi": "听录音，选图片", "instructionVi": "Nghe băng, chọn tranh",
     "source_page": 12,
     "items": [{"label": "1", "imageRef": "p12-crop-1", "audioFile": "01-1.mp3", "answer": "B"}]}
  ],
  "images": [{"ref": "p12-crop-1", "page": 12, "cropBox": [x, y, w, h], "file": "lesson-01/p12-crop-1.png"}]
}}
```

Đáp án: nếu Phase 1 xác nhận có trang 答案 → OCR làm ground truth; không → tự giải khi trích + user spot-check 100%.

## Related Code Files

- Create: `content-source/tools/crop_exercise_images.py` (đọc cropBox trong JSON v3 → render dpi 300-500 → xuất PNG)
- Create: `content-source/extracted-wb/lesson-01.json`, `lesson-02.json`
- Reuse: `render/ocr_full_wb/`, `ocrspace_cache_wb/` từ Phase 1

## Implementation Steps

1. Trích đề bài 1-2 từ cache OCR + vision band-crop (dpi 220 cho khối đề, verbatim — luật như pipeline giáo khoa)
2. Điền đáp án (từ 答案 nếu có, không thì tự giải), đánh `suspect` cho chỗ nghi ngờ
3. Ghi `cropBox` cho ảnh đề vào JSON → chạy `crop_exercise_images.py` → review từng PNG crop đúng khung chưa
4. Map đề nghe ↔ track: đối chiếu mã track in trong đề với `audio-manifest.txt`; thiếu file → ghi `audioFile` dự kiến + đánh dấu `audio-missing`
5. Verify 4 lớp: presence hanzi trong OCR cache trang đó; pypinyin chỗ sinh pinyin; đáp án ∈ tập lựa chọn; ảnh ref ↔ đề khớp
6. User spot-check toàn bộ bài 1-2 → sửa → chốt schema v3 + catalog cuối

## Success Criteria

- [x] Bài 1: mọi 题 có typeCode hợp lệ theo catalog, payload khớp payload_schema (12 đề, validator pass). Bài 2: chờ
- [x] 100% đáp án bài 1 được user xác nhận (35/35 khớp answer key)
- [ ] ~~100% ảnh crop đúng khung~~ — BỎ (pivot 21/09): bỏ cropBox, 27 image slot chỉ cần desc; user upload ảnh qua UI
- [x] Đề nghe có audioFile (01-1.mp3, 01-2.mp3 — file có sẵn trong `content-source/audio/hsk2/`)
- [x] Schema v3 + catalog tuyên bố ĐÓNG cho 12 typeCodes của L1 (validator chặn; typeCode mới ở batch sẽ mở rộng có kiểm soát)

## Outcome (sync-back 21/09)

L1 khép kín: `content-source/extracted-wb/lesson-01.json` (12 đề, 27 ảnh slot, 35 đáp án) + đã import dev DB. L2 chờ answer key user paste (định dạng "lesson 2:" raw text → parse + verify vs scan). Check script: `content-source/tools/check_lesson01_json.py`. Suspect còn mở: pinyin đề 22 có thể OCR-truncated; vài gloss vi dịch lại.

## Risk Assessment

- 题型 lạ xuất hiện ở bài 1-2 → thêm typeCode vào catalog + payload_schema, chạy lại verify; đây là mục đích của pilot
- Crop ảnh sai khung lần đầu là bình thường → cropBox sửa 2-3 lượt là chuẩn
- Audio chưa có lúc pilot → không chặn; chỉ cần mapping track đúng
