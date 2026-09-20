---
phase: 5
title: Vocabulary Profile Extraction
status: completed
priority: P2
effort: 4h
dependencies:
  - '1'
---

# Phase 5: Vocabulary Profile Extraction

## Overview

Trích xuất Vocabulary (study, review-dashboard, flashcard, quiz ×2, list/card/stats) + Profile (page, edit form, change password, avatar picker, stats). Domain: `vocabulary`, `profile`.

## Requirements

- Functional: labels, hints, quiz instructions, nút, stats labels dùng `t()`
- Non-functional: nghĩa từ vựng VN/EN từ DB vẫn do `language-preference-store` điều khiển — KHÔNG đụng

## Architecture

- Vocabulary files: `vocabulary-study-page` (22), `review-dashboard-page` (16), `flashcard-card` (19), `quiz-card` (10), `quiz-pinyin-match` (7), `quiz-fill-blank` (5), `stats-card` (11), `vocabulary-list` (1), `vocabulary-card` (1)
- Review-dashboard đang có 3 error fallback tiếng Anh ("Failed to load stats"...) → chuyển sang `translateApiError` + key `errors.loadStats`, `errors.loadCards`, `errors.navigation`
- Profile files: `profile-page` (2), `profile-edit-form` (6), `change-password-form` (8), `profile-stats-grid` (5), `avatar-emoji-picker` (1)
- Change-password lỗi backend `Current password is incorrect` → đã có key từ phase 1, wire qua `translateApiError`

## Related Code Files

- Modify: `frontend/src/pages/vocabulary/vocabulary-study-page.tsx`, `review-dashboard-page.tsx`, `frontend/src/components/vocabulary/*.tsx` (7 files), `frontend/src/pages/profile/profile-page.tsx`, `profile-edit-form.tsx`, `change-password-form.tsx`, `profile-stats-grid.tsx`, `avatar-emoji-picker.tsx`
- Modify: `frontend/src/i18n/locales/vi.json` (thêm `vocabulary`, `profile`)
- Create: none

## Implementation Steps

1. Extract `vocabulary`: study page tabs, flashcard hints (Hiện nghĩa/Ẩn nghĩa), quiz hướng dẫn làm bài, stats labels
2. Review-dashboard: 3 error fallback → `translateApiError`
3. Extract `profile`: form labels, placeholder, nút lưu, validation message client-side, stats grid
4. Wire change-password + edit-form errors qua `translateApiError`
5. Build pass + tự test: học từ vựng (flashcard + 2 quiz), review dashboard, sửa profile, đổi mật khẩu sai mật khẩu cũ

## Success Criteria

- [ ] 0 string tiếng Việt hardcode trong files trên
- [ ] Lỗi đổi mật khẩu sai hiện theo key (không còn "Current password is incorrect" raw ở UI path đã wire)
- [ ] Flashcard/quiz hoạt động nguyên trạng

## Risk Assessment

- Thấp-vừa. Quiz instructions là câu dài — dịch en/zh ở phase 7 cần tự nhiên, không word-by-word

## Security Considerations

- Form mật khẩu: không đặt password vào placeholder dịch được nhầm là giá trị; message lỗi không lộ thông tin DB
