---
phase: 1
title: Cut fake quiz modes
status: completed
priority: P2
effort: 1h
dependencies: []
---

# Phase 1: Cut fake quiz modes

## Overview

Xóa mode Fill Blank + Pinyin Match (mock dở dang: câu hỏi cứng "这是___什么", distractor ký tự/pinyin random, kẹt không advance, không feedback). `/study` còn 2 mode Flashcard + Quiz.

## Requirements

- Functional: `/study` render đúng 2 nút mode; mọi tham chiếu `fill-blank`/`pinyin-match` biến mất khỏi codebase frontend.
- Non-functional: `npm run build` (tsc + vite) pass sau phase.

## Architecture

Không đổi kiến trúc — chỉ thu hẹp enum `StudyMode` từ 4 giá trị còn 2, xóa 2 component và branches render tương ứng, dọn state thừa trong `vocabulary-study-page.tsx` (`quizResults`, `currentQuizIndex`, `handleQuizAnswer`, `handleNextQuizQuestion` — flashcard + quiz tự quản state qua store).

## Related Code Files

- Delete: `frontend/src/components/vocabulary/quiz-fill-blank.tsx`, `frontend/src/components/vocabulary/quiz-pinyin-match.tsx`
- Modify: `frontend/src/pages/vocabulary/vocabulary-study-page.tsx`, `frontend/src/stores/vocabulary-store.ts`, `frontend/src/i18n/locales/vi.json`, `frontend/src/i18n/locales/en.json`, `frontend/src/i18n/locales/zh.json`

## Implementation Steps

1. Xóa 2 file component `quiz-fill-blank.tsx`, `quiz-pinyin-match.tsx`.
2. `vocabulary-study-page.tsx`:
   - Bỏ imports 2 component; `StudyModeId` = `'flashcard' | 'quiz'`.
   - `studyModes` còn 2 mục (flashcard, quiz); grid `grid-cols-2` giữ nguyên — 2 nút lớn cạnh nhau.
   - Bỏ `currentQuizIndex`, `quizResults`, `handleQuizAnswer`, `handleNextQuizQuestion`; render branch `studyMode === 'flashcard' | 'quiz'` dùng store.
3. `vocabulary-store.ts`: `StudyMode` = `'flashcard' | 'quiz'`; đơn giản hóa `setStudyMode` (reset quiz state khi rời quiz).
4. i18n 3 locale: xóa `vocabulary.modes.fillBlank`, `vocabulary.modes.pinyinMatch`, `vocabulary.modeDesc.fillBlank`, `vocabulary.modeDesc.pinyinMatch`, `vocabulary.fillBlank.*`, `vocabulary.pinyinMatch.*`.
5. Rà `vocabulary.common.wrongAnswer` + `vocabulary.common.nextArrow`: grep chỗ khác dùng — chỉ xóa key nếu zero reference còn lại (quiz đang dùng `vocabulary.quiz.wrong` / `vocabulary.quiz.next`, không dùng common).
6. `cd frontend && npm run build` pass.

## Success Criteria

- [ ] 2 file component đã xóa; grep `fill-blank|fillBlank|pinyin-match|pinyinMatch|FillBlank|PinyinMatch` trong `frontend/src` trả về 0 kết quả (trừ key đã dọn trong locale).
- [ ] `/study` hiển thị 2 nút mode, chọn level + từng bài vẫn chạy.
- [ ] Build pass.

## Risk Assessment

Thấp — thay đổi thu hẹp thuần túy. Rủi ro duy nhất: xóa nhầm key i18n dùng chung → grep trước khi xóa (step 5).
