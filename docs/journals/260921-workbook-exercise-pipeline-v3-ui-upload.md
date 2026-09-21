---
date: 2026-09-21
type: implementation-complete
topic: workbook-exercise-pipeline-v3-ui-upload
---

# Bài tập sách bài tập HSK2: pipeline v3 + UI upload inline — L1 đóng end-to-end

## Context

Plan `plans/260921-1015-workbook-exercise-scan-pipeline/`. Đưa sách bài tập HSK2 vào app trọn bộ: DB (Exercise/ExerciseImage + 2 migrations), ExercisesModule (serve/upload media, JWT guard), importer CLI idempotent, UI 7 renderers / 12 typeCodes với upload ảnh inline, i18n vi/en/zh.

## What happened

Hai pivot giữa session, user chốt:
1. Bỏ crop workflow — user tự upload scan qua UI tại từng slot ảnh. Bớt nguyên một pipeline xử lý ảnh.
2. UI bài tập kéo vào phạm vi (trước là "phase sau") — session từ "làm importer" thành full-stack trong một ngày.

L1 (bài 1) đóng end-to-end: 12 đề / 27 slot ảnh / **35/35 đáp án khớp key user**; import vào dev DB; re-import → `removed: 0/0` — idempotency chứng minh chạy thật, không chỉ trên giấy.

## Key decisions

| Quyết định | Lý do |
|---|---|
| Ảnh pending trong DB, user upload qua UI | Pivot 1: bỏ crop pipeline, đơn giản hơn và user kiểm soát từng ảnh |
| Thêm `apiClient.postForm` | BLOCKER review: `post` JSON-stringify FormData → upload chết lặng từ đầu mà không ai thấy |
| Importer map imageRef theo order, không vị trí mảng | MAJOR: positional coupling gãy ngay khi đề thiếu ảnh |
| Object-URL tạo trong queryFn | MAJOR: tạo trong select unstable → URL recreate/leak mỗi render |

Code-review: REQUEST-CHANGES (1 BLOCKER, 2 MAJOR, 2 MINOR + advisory) → fix hết, re-verify sạch.

## Verification

96/96 backend tests (9 suites), frontend tsc sạch, locale JSON hợp lệ. Smoke 4 route → 401 hết khi không token = module mount + guard OK (lưu ý :3000 bị Docker Desktop chiếm, test trên :3100). **Chưa commit** — user muốn review tay trước.

## Bài học

- **Upload chưa từng chạy thật tới review mới lộ**: FormData bị stringify là loại bug smoke 401 không bắt được. Smoke phải cover cả happy path có payload, không chỉ guard.
- Side effect (createObjectURL) không nằm trong select — select phải pure, vi phạm là leak từng render.
- Pivot 2 lần vẫn kiểm soát được vì plan ghi rõ status từng phase. Scope "để phase sau" thành phase này là chuyện thường — plan phải nuốt được pivot, không phải bất biến.

## Next

1. User paste answer key từng bài (`lesson 2:` …) → build JSON → import. Sách không có trang đáp án cho L2-15, chờ user là blocker duy nhất
2. Upload ảnh thật L1 qua UI, spot-check hiển thị
3. Commit sau khi user review; batch import prod là phase 5

## Câu hỏi chưa giải quyết

- Không blocker.
