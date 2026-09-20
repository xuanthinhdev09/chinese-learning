# Brainstorm Report: Dọn dẹp các mode ôn tập tại /study

- **Date:** 2026-09-20
- **From:** Brainstormer → Planner
- **Status:** User đã duyệt thiết kế + chốt chuyển `/ck:plan` (mặc định)
- **Work context:** `C:/My Work/chinese-learning/chinese-learning`

## 1. Problem Statement

User nhận thấy tất cả option học từ vựng tại `/vocabulary/study` có chức năng giống nhau. Kết quả scout xác nhận — thực tế tệ hơn:

### Hiện trạng 4 mode

| Mode | Trạng thái | Bằng chứng |
|------|-----------|------------|
| 📇 Flashcard | ✅ Hoàn chỉnh | Lật thẻ, TTS 5 tốc độ, rating SM-2 (0/3/4/5) → `POST /vocabulary/progress`. Mode DUY NHẤT ghi progress. |
| 🎯 Quiz | ⚠️ Chạy được, không ghi progress | Hanzi → chọn nghĩa, có điểm %. Không gọi `recordProgress`. Logic sinh options trùng 2 nơi (store `createQuizOptions` + component `generateOptions`). |
| ✏️ Fill Blank | ❌ Gãy | Câu hỏi cứng `这是___什么` cho mọi từ; distractor 17 ký tự cố định. Page không truyền `showResult` → submit không feedback, không advance → kẹt từ đầu tiên. |
| 🔊 Pinyin Match | ❌ Gãy + naive | Distractor chèn thanh điệu vào trước ký tự đầu ("hǎo"→"hā/há/hà", fallback "hǎo2") — mất phần vần. Cùng bug kẹt. Không TTS dù emoji 🔊. |

### Bug ngoài mode
- Nút "Ôn tập từ đến hạn" (`review-dashboard-page.tsx:35`): load due vocab vào store rồi navigate `/vocabulary/study` — nhưng study page luôn hiển thị picker khi không có URL params → due vocab bị bỏ, flow ôn due chưa bao giờ chạy.
- Options regenerate mỗi render (fill-blank/pinyin-match không memoize) → ký tự đổi vị trí sau khi chọn.

### Bối cảnh liên quan
- `/today` (Học hôm nay) là pipeline chính, hoạt động đúng, có ghi SM-2 qua `recordVocabQuality`.
- Backend đủ: `POST /vocabulary/progress` (SM-2), `GET /vocabulary/progress/due`, `GET /vocabulary/progress/stats` (`backend/src/spaced-repetition/spaced-repetition.controller.ts`).
- Chỉ HSK2 có content (15 lessons, 171 vocab).
- Không có test nào tham chiếu 2 mode sắp cắt (grep xác nhận).

## 2. Quyết định của user (AskUserQuestion — đã chốt)

1. **Hướng xử lý:** Cắt còn Flashcard + Quiz (YAGNI/KISS) — bỏ Fill Blank + Pinyin Match.
2. **SM-2 cho quiz:** Có — mapping đơn giản: đúng = quality 5, sai = quality 1.
3. **Nút "Ôn tập từ đến hạn":** Vào thẳng session ôn (không qua picker).

## 3. Thiết kế đã duyệt

### Phase A — Cắt 2 mode giả
- Xóa `frontend/src/components/vocabulary/quiz-fill-blank.tsx`, `quiz-pinyin-match.tsx`.
- `vocabulary-study-page.tsx`: bỏ imports, `StudyModeId` = `'flashcard' | 'quiz'`, `studyModes` còn 2 mục (2 nút lớn cạnh nhau), bỏ state thừa `quizResults`/`currentQuizIndex`/`handleQuizAnswer`.
- `vocabulary-store.ts`: `StudyMode` còn 2 giá trị, đơn giản hóa `setStudyMode`.
- i18n (vi/en/zh): xóa `vocabulary.modes.fillBlank/pinyinMatch`, `vocabulary.modeDesc.*` tương ứng, `vocabulary.fillBlank.*`, `vocabulary.pinyinMatch.*`. Rà `vocabulary.common.wrongAnswer` trước xóa.

### Phase B — Quiz ghi SM-2
- `submitQuizAnswer` trong store: sau khi tính `isCorrect` → `recordProgress({ vocabularyId, quality: isCorrect ? 5 : 1 })`, báo lỗi qua `progressError` sẵn có.
- Retry quiz ghi lại tự nhiên (đúng bản chất ôn lại).

### Phase C — Fix flow ôn từ đến hạn
- `handleStartReview`: bỏ `loadDueVocabularies` trước navigate → `navigate('/vocabulary/study?mode=flashcard&due=1')` — một đường load duy nhất qua URL (pattern hiện có, tránh double-fetch).
- Effect restore trong study page nhận `due=1` → `loadDueVocabularies(20)`; header "Từ đến hạn (N)" thay tên level; nút "Đổi bài" về picker vẫn chạy.

## 4. Acceptance Criteria

1. `/study` chỉ còn 2 nút Flashcard + Quiz; zero reference sót tới 2 mode đã cắt.
2. Trả lời quiz → `recordProgress` gọi với quality đúng → dueToday/stats thay đổi sau session.
3. Bấm "Ôn tập từ đến hạn" → vào thẳng flashcard ~20 từ due, không qua picker.
4. Build + typecheck pass.

## 5. Out of Scope

- Câu ví dụ thật cho fill-blank, distractor pinyin thông minh (đã cắt luôn mode).
- `/today` (đang tốt, không đổi).
- Backend (không đổi endpoint nào).

## 6. Rủi ro

- Đáp án đúng = quality 5 → từ mới nhảy interval xa, due giảm nhanh → quan sát 1 tuần, đổi mapping nếu cần (1 dòng).
- Keys i18n dùng chung phải rà kỹ trước xóa.

## 7. Files liên quan

**Xóa:** `frontend/src/components/vocabulary/quiz-fill-blank.tsx`, `frontend/src/components/vocabulary/quiz-pinyin-match.tsx`
**Sửa:** `frontend/src/pages/vocabulary/vocabulary-study-page.tsx`, `frontend/src/pages/vocabulary/review-dashboard-page.tsx`, `frontend/src/stores/vocabulary-store.ts`, `frontend/src/i18n/locales/{vi,en,zh}.json`
**Đọc tham khảo:** `frontend/src/components/vocabulary/flashcard-card.tsx`, `quiz-card.tsx`, `backend/src/spaced-repetition/spaced-repetition.controller.ts`, `frontend/src/api/vocabulary-api.ts`

## 8. Next Steps

1. `/ck:plan` (mặc định) từ báo cáo này → plan theo phase.
2. Sau implement: chạy build + typecheck, test tay 3 acceptance criteria.
3. Quan sát mapping quiz quality sau 1 tuần dùng thực tế.
