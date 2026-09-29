---
phase: 2
title: Translate sync dialogue English data
status: completed
priority: P1
effort: 2h
dependencies:
  - 1
---

# Phase 2: Dịch + sync dữ liệu hội thoại

## Overview

Dịch 230 dòng `vietnamese → english` vào JSON nguồn, rồi sync vào DB.

## Requirements

- Functional: 230 dòng đều có `english` trong DB.
- Non-functional: idempotent; giữ nguyên `hanzi`/`pinyin`/`vietnamese`.

## Related Code Files

- Modify (ngoài repo): `content-source/extracted-v2/conversations-lesson-01..15.json` (thêm field `english`)
- Create (ngoài repo): `content-source/tools/translate-conversations-english.py` hoặc tự dịch thủ công
- Create: `backend/src/scripts/sync-conversation-english.ts` (match lesson order + conversation order → update DB)

## Implementation Steps

1. Dịch `vietnamese → english` cho 230 dòng (tự dịch — tránh quota Gemini; pattern như `apply_gloss_en.py`).
2. Ghi `english` vào `conversations-lesson-NN.json`.
3. Viết + chạy `sync-conversation-english.ts`: đọc JSON → match (lesson order → lessonId, conversation order) → `UPDATE conversations SET english`.
4. Verify: count `english` trong DB = 230.

## Success Criteria

- [ ] 230/230 dòng có `english` trong DB.
- [ ] Nội dung `hanzi`/`pinyin`/`vietnamese` không đổi.

## Risk Assessment

- Dịch sai ngữ cảnh hội thoại → review từng dòng (230 dòng, mỗi dòng ngắn).
- Match theo (lesson order, conversation order) phải đúng; dòng có `dialogueOrder` null (legacy) vẫn match được theo `order`.
