# Brainstorm Report: Default phạm vi học theo bài đang học (/study)

- **Date:** 2026-09-20
- **From:** Brainstormer → Planner
- **Status:** User đã duyệt thiết kế + chốt plan + cook luôn
- **Work context:** `C:/My Work/chinese-learning/chinese-learning`

## 1. Problem Statement

Mở `/vocabulary/study` chọn level rồi bấm mode (không chọn chip bài) → mặc định học **tất cả từ của level**. User muốn: khi không chọn gì, phạm vi phải là **bài đang học của tài khoản** (theo tiến độ).

## 2. Scout findings

- Backend đã có `findNextLesson(userId, courseId)` (`daily-session.service.ts:217`): bài đầu chưa hoàn thành theo `order` — `/today` đang dùng cho mục "Bài mới"
- `resolveActiveCourseId()` pin course đang học; `UserProgress` track isCompleted per user+lesson
- Frontend `startQuiz`/`loadByHSKLevel` đã nhận `lessonId` — chỉ thiếu đường biết bài hiện tại
- Chưa có endpoint riêng trả current lesson (`GET /daily-session` trả kèm nhưng nặng: lines + keywords + vocab)

## 3. Quyết định user (đã chốt)

1. **UX:** Tự pre-select level + chip "Bài N" đang học khi mở `/study`; user vẫn chọn tay được
2. **Định nghĩa "đang học":** bài chưa hoàn thành đầu tiên (reuse `findNextLesson` — nhất quán với `/today`)
3. **Phạm vi:** cả Flashcard + Quiz

## 4. Thiết kế đã duyệt

### Phase 1 — Backend
- `GET /daily-session/current-lesson` (JWT) → `{ lessonId, lessonTitle, order, courseId } | null`
- Tái dùng `findNextLesson` + `resolveActiveCourseId`; select nhẹ (id/title/order/courseId, không kèm conversations)
- Thêm unit test service vào spec có sẵn

### Phase 2 — Frontend
- `frontend/src/api/daily-session.ts`: thêm `getCurrentLesson()`
- `vocabulary-study-page.tsx`: sau khi `hskLevels` load → fetch current-lesson → set `selectedLevel` (match courseId) + `selectedLessonId`
- Race guard: chỉ pre-select khi `selectedLevel === null` (user chưa bấm)
- Fallback: null / course không trong list → hành vi cũ (default "Tất cả")
- Không i18n mới, không đổi `/today`, không đổi flow review due

## 5. Acceptance Criteria

1. Mở `/study` chưa bấm gì → course đang học + chip bài đang học chọn sẵn; bấm mode (flashcard hoặc quiz) → học đúng bài đó
2. Chọn tay ("Tất cả" / bài khác) ghi đè pre-select
3. User mới → pre-select bài 1; học xong hết → fallback hành vi cũ
4. Build (tsc+vite) + backend test pass

## 6. Out of Scope

- Badge "Đang học" trên chip; nút "Tiếp tục học" riêng; đổi `/today`; đánh dấu hoàn thành bài

## 7. Rủi ro

- Race pre-select vs user click → guard `selectedLevel === null`
- `findNextLesson` hiện include conversations → cần biến thể select nhẹ, tránh tải thừa

## 8. Files

**Backend:** `daily-session.controller.ts`, `daily-session.service.ts`, `dto/daily-session.dto.ts`, `daily-session.service.spec.ts`
**Frontend:** `api/daily-session.ts`, `pages/vocabulary/vocabulary-study-page.tsx`

## 9. Next Steps

`/ck:plan` fast mode (2 phase) → cook.
