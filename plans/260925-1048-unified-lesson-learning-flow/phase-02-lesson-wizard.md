---
phase: 2
title: "Lesson wizard"
status: completed
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 2: Lesson wizard

## Overview

Trang mới `/learn/:lessonId` — wizard 3 giai đoạn (từ vựng → luyện nghe → exercises). Mỗi giai đoạn tự nhận biết hoàn thành và gọi `POST /daily-session/activity-complete`. Đủ 3 → hiện "Lesson hoàn thành" + dẫn sang bài kế.

## Requirements

- Functional:
  - Stepper hiển thị 3 bước, <!-- 260926 --> chọn tự do (mọi bước bấm được, thứ tự tùy ý), bước xong hiện checkmark.
  - Stage 1 **Từ vựng**: flashcard → trắc nghiệm (<!-- Validation 260925-1048 --> ép tuần tự: xong flashcard mới mở quiz). Xong = hết flashcard VÀ hết quiz.
  - Stage 2 **Luyện nghe**: `DialogueReader`. Xong = pass 1 lượt.
  - Stage 3 **Exercises**: `ExerciseCard`. Xong = <!-- Validation 260925-1048 --> câu có nút kiểm tra phải chấm hết; câu chỉ nghe/đọc (stroke order, drill) tính xong khi mở.
  - Mỗi stage xong → gọi `activity-complete` 1 lần (sticky), hiện checkmark.
  - Đủ 3 → banner "hoàn thành" + nút "bài kế tiếp" (nếu có) / "về trang chủ".
  - <!-- Validation 260925-1048 --> Reload: mount → gọi `getLessonStatus(lessonId)` khôi phục checkmark các stage đã xong.
- Non-functional:
  - Tái dùng component có sẵn, không viết lại logic stage.
  - Auto-detect logic nằm trong **pure helper** (testable), không vùi trong UI.

## Architecture

```
/learn/:lessonId
  → useResolveLessonId(lessonId) (có sẵn)
  → LessonLearnPage
      ├─ StageStepper (3 bước, trạng thái từ GET status)
      ├─ Stage 1: VocabStage (FlashcardCard → QuizCard, đếm hết để detect)
      ├─ Stage 2: DialogueStage (DialogueReader, onPass → complete)
      └─ Stage 3: ExercisesStage (ExerciseCard, checkable chấm hết + view-only mở → complete)
```

Pure helpers (tách module riêng, ví dụ `frontend/src/pages/lessons/completion-detection.ts`):
- `isVocabStageComplete({ cardsDone, quizDone })`
- `isExercisesStageComplete({ checkableCheckedCount, checkableTotal, viewOnlySeenCount, viewOnlyTotal })` — checkable chấm hết, view-only mở là xong

API bổ sung ở `frontend/src/api/daily-session.ts`:
- `completeActivity(lessonId, activity)` → POST
- `getLessonStatus(lessonId)` → GET 3 flag + `isCompleted` (khôi phục trạng thái khi reload).

## Related Code Files

- Create: `frontend/src/pages/lessons/lesson-learn-page.tsx`
- Create: `frontend/src/pages/lessons/completion-detection.ts` (pure helpers)
- Create: `frontend/src/components/lessons/stage-stepper.tsx`
- Reuse: `components/vocabulary/flashcard-card.tsx`, `quiz-card.tsx`, `components/today/dialogue-reader.tsx`, `components/exercises/exercise-card.tsx`
- Modify: `frontend/src/api/daily-session.ts`
- Modify: `frontend/src/App.tsx` (thêm route `/learn/:lessonId`)

## Implementation Steps (--tdd)

1. Viết pure helper `completion-detection.ts` + các trường hợp (chưa đủ/đủ/0 bài tập).
2. Thêm route `/learn/:lessonId` trong `App.tsx`.
3. Dựng `LessonLearnPage` với `StageStepper`; mount → `getLessonStatus()` seed trạng thái done stage (reload giữ checkmark).
4. Wire Stage 1 (VocabStage): ép flashcard trước, xong flashcard mới mở quiz; detect xong cả 2 → `completeActivity('vocab')`.
5. Wire Stage 2 (DialogueStage): `DialogueReader`, onPass → `completeActivity('dialogue')`.
6. Wire Stage 3 (ExercisesStage): tách checkable vs view-only — theo dõi `checkedMap` (checkable) + `seenSet` (view-only); checkable chấm hết + view-only mở hết → `completeActivity('exercises')`.
7. Đủ 3 flag → banner hoàn thành + nút chuyển bài kế (resolve `getCurrentLesson`/order kế).
8. `npx tsc --noEmit` (frontend) → 0 lỗi; QA thủ công từng stage.

## Success Criteria

- [ ] `/learn/:lessonId` render wizard 3 bước đúng thứ tự.
- [ ] Mỗi stage detect đúng điều kiện xong và chỉ gọi `activity-complete` 1 lần.
- [ ] Đủ 3 → hiện trạng thái hoàn thành + chuyển bài kế.
- [ ] Reload không double-complete (sticky server-side).
- [ ] `npx tsc --noEmit` frontend sạch.

## Risk Assessment

- **Reload mất trạng thái stage**: đã xử lý bằng `getLessonStatus()` seed khi mount (<!-- Validation 260925-1048 --> đã chốt).
- **Vocab ép tuần tự**: flashcard xong mới mở quiz (đã chốt). Nếu user muốn nhảy thẳng quiz sẽ bị chặn — chấp nhận theo yêu cầu.
- **Exercises view-only vs checkable**: phân loại đúng từ `exercise-types.ts`; bài có cả 2 loại thì checkable vẫn phải chấm hết, view-only tính xong khi mở. Verify lúc implement.
- **Data load**: stage component hiện có tự fetch — cần pass `lessonId` vào đúng cách, tránh double-fetch (tái dùng React Query queryKey có sẵn).
