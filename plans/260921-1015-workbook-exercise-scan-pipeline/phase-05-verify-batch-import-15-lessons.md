---
phase: 5
title: "Verify & Batch Import 15 Lessons"
status: pending
priority: P2
effort: "6-8h"
dependencies: ["phase-03-pilot-extraction-lessons-1-2", "phase-04-importer-cli-validators"]
---

# Phase 5: Verify & Batch Import 15 Lessons

## Overview

Batch trích bài 3-15 theo schema v3 đã đóng, verify từng bài, import toàn bộ 15 bài vào DB dev rồi prod. Cập nhật docs workflow.

## Requirements

- Functional: 15/15 bài có Exercise trong DB; audio missing được liệt kê thành checklist cho user补 file
- Non-functional: agent song song tối đa 4-6 (rate-limit vision — bài học pipeline giáo khoa)

## Architecture

Batch theo wave: mỗi agent 1 bài, prompt có "DO NOT STOP until file written" (bài học đã ghi trong SOP). Verify script chạy trên từng file trước khi wrap + import.

```
extracted-wb/lesson-03..15.json → verify_workbook_lessons.py → workbook-hsk2.json (merge)
→ npm run import:workbook -- workbook-hsk2.json (dev) → spot-check → prod (migrate + import)
```

## Related Code Files

- Create: `content-source/tools/verify_workbook_lessons.py` (presence OCR cache, answer ∈ options, imageRef/audioFile tồn tại, pypinyin chỗ sinh)
- Create: `content-source/extracted-wb/lesson-03..15.json`, merge `workbook-hsk2.json`
- Modify: `docs/textbook-scan-extraction-workflow.md` (thêm section Workbook), `docs/project-changelog.md`
- Modify: `plans/260921-1015-.../` status cuối phase

## Implementation Steps

1. Trích batch bài 3-15 (wave 2-3 bài/agent, skip band, band-crop dpi 220; đề nghe audioFile map từ manifest)
2. Chạy `verify_workbook_lessons.py` per file → sửa cho sạch warning nghiêm trọng trước khi merge
3. Merge `workbook-hsk2.json` (script python nhỏ, không tay — mẫu `wrap_import_files.py`)
4. Import dev qua tunnel → summary per bài → spot-check ngẫu nhiên 3 bài trên DB query
5. Chốt checklist audio-missing + ảnh thiếu (nếu có) → gửi user
6. Prod: tunnel/VPS — `prisma migrate deploy` + import; verify count khớp dev
7. Cập nhật docs (workflow + changelog), journal entry

## Success Criteria

- [ ] 15/15 bài import đủ, số đề per bài khớp verify report
- [ ] Re-import toàn bộ file merge 1 lần nữa → không duplicate, không mất gì (idempotent)
- [ ] Checklist audio-missing bàn giao user (nếu audio chưa đủ)
- [ ] Prod khớp dev (count + spot-check payload)
- [ ] Docs + changelog cập nhật

## Risk Assessment

- Vision/OCR sai ở đề dài (bài sau khối lượng tăng) → cross-check pypinyin + presence bắt phần lớn; chỗ nghi chỉ `suspect` và để user spot-check cuối
- Rate-limit khi chạy nhiều agent → giới hạn 4-6, retry ngay không sleep (foreground sleep bị chặn)
- Prod migrate quên → migrate deploy trước import, check `migrate status` sau

## Note (sync-back 21/09)

Nhịp batch đổi theo pivot: KHÔNG render/OCR-all trước; trích per bài khi có answer key user paste. Ảnh KHÔNG crop — sau import user tự upload qua UI (`/lessons/:id/exercises`, slot hiện desc để đối chiếu trang in). Đề nghe: audio NN-1/NN-2 đã có sẵn 30 track; import copy tự động, thiếu thì vào checklist.
