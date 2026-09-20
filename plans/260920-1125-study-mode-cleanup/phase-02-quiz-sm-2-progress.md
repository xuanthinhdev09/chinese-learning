---
phase: 2
title: Quiz SM-2 progress
status: completed
priority: P2
effort: 45m
dependencies:
  - '1'
---

# Phase 2: Quiz SM-2 progress

## Overview

Nối Quiz vào SM-2: mỗi lần submit đáp án gọi `recordProgress` với quality = đúng 5 / sai 1 (user chốt mapping đơn giản). Học quiz giờ cũng làm giảm số từ đến hạn.

## Requirements

- Functional: submit đáp án quiz → `POST /vocabulary/progress` với `{ vocabularyId, quality: isCorrect ? 5 : 1 }`; lỗi API không chặn chuyển câu tiếp theo.
- Non-functional: không thêm state mới ngoài `progressError` sẵn có; không đổi backend.

## Architecture

Sửa 1 điểm duy nhất trong `vocabulary-store.ts` — action `submitQuizAnswer` đã có `isCorrect` và `current.id` tại chỗ set `showResult`. Gọi API fire-and-forget (không `await` trước khi set state), catch lỗi vào `progressError`. Retry quiz (`resetQuiz`) gọi lại tự nhiên — đúng bản chất ôn lại, không cần dedupe.

Lưu ý: `quiz-card.tsx` render đáp án từ `quiz.options` (đã có id từ vựng gốc trong option `id` trước khi bị ghi đè `option-${idx}` — dùng `vocabularies[currentIndex].id`, không parse option id).

## Related Code Files

- Modify: `frontend/src/stores/vocabulary-store.ts`
- Đọc tham khảo: `frontend/src/components/vocabulary/quiz-card.tsx`, `frontend/src/api/vocabulary-api.ts` (`recordProgress`), `frontend/src/components/vocabulary/flashcard-card.tsx` (mẫu hiển thị `progressError`)

## Implementation Steps

1. Trong `submitQuizAnswer`: sau khi tính `isCorrect`, gọi `vocabularyApi.recordProgress({ vocabularyId: current.id, quality: isCorrect ? 5 : 1 }).catch(err => set({ progressError: ... }))` — fire-and-forget, không block UI.
2. `quiz-card.tsx`: hiển thị `progressError` (nếu có) dạng dòng chữ nhỏ dưới feedback — làm 1 lần, không cần banner to.
3. Build pass; test tay: trả lời đúng 1 câu → DevTools Network thấy POST quality 5; sai → quality 1; trang stats (`/vocabulary/review`) phản ánh.

## Success Criteria

- [ ] Submit quiz → POST `/vocabulary/progress` với quality đúng (5/1), verify bằng Network tab.
- [ ] Lỗi API (VD offline) hiện `progressError`, quiz vẫn chuyển câu.
- [ ] Build pass.

## Risk Assessment

- Đúng = 5 (Easy) → từ mới nhảy interval xa, due giảm nhanh. Đã user chốt chấp nhận; quan sát 1 tuần, đổi mapping nếu cần (1 dòng).
- Ghi trùng khi retry quiz: chấp nhận — retry là ôn lại, SM-2 tự điều chỉnh.
