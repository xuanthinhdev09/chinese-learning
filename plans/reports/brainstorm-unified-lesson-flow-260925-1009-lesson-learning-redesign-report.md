# Brainstorm — Unified Lesson Learning Flow (3-stage unlock)

Date: 2026-09-25 · Type: brainstorm · Status: approved (Approach A)

## Problem

Header có 3 nút nav (Hôm nay, Trình độ HSK, Từ Vựng) gây rối cho người học mới. Trang chủ nên chỉ có 1 hành động "bắt đầu học". Học nên theo 1 luồng lesson 3 giai đoạn rõ ràng, mở khóa lesson kế tiếp chỉ khi hoàn thành đủ cả 3.

## Locked requirements (đã chốt với user)

| Mục | Quyết định |
|---|---|
| Cấu trúc luồng | **A. Wizard thống nhất** — 1 trang stepper 3 bước |
| Mở khóa | 3 flag riêng, đủ 3 → mở lesson kế tiếp |
| Xong từ vựng | Flashcard + trắc nghiệm hoàn thành (tự nhận biết) |
| Xong luyện nghe | Pass 1 lượt shadowing |
| Xong exercises | Tự nhận biết đã chấm hết mọi câu |
| Tự chọn bài | Cùng cấu trúc 3 phần, user tự chọn (tôn trọng lock) |
| Route cũ | Ẩn khỏi nav, giữ route |
| SRS / /today | Tách "ôn tập" riêng trên trang chủ; /today thành legacy |

## Current state (scout)

- Router `frontend/src/App.tsx`: index→/today; routes today/dashboard/hsk/hsk:id/lessons/lessons:exercises/vocabulary-study/vocabulary-review/profile. Đăng nhập auto về /today.
- Header `components/layout/header/header.tsx` + `mobile-menu.tsx`: 3 nút nav + logo→/dashboard + avatar→/profile.
- Homepage `pages/dashboard/dashboard-page.tsx`: hero "Học hôm nay"→/today + 2 chip (streak, due vocab).
- `/today` `pages/today/today-session-page.tsx`: luồng 1 nút (due-dialogue→new-dialogue→keyword→vocab). Finish→`completeSession()` set `UserProgress.isCompleted`.
- Schema `backend/prisma/schema.prisma`: `UserProgress.isCompleted` là cổng mở khóa DUY NHẤT. `UserVocabularyProgress` (SRS từ), `UserDialogueProgress` (SRS hội thoại) KHÔNG gate unlock. Exercises KHÔNG có model progress.

## Data model change

Mở rộng `UserProgress` (thêm 3 cột nullable DateTime, giữ `isCompleted` làm cổng):

- `vocabCompletedAt DateTime?`
- `dialogueCompletedAt DateTime?`
- `exercisesCompletedAt DateTime?`
- `isCompleted` / `completedAt` = **derive** (true khi cả 3 set) lúc ghi

Lock logic hiện tại KHÔNG đổi (`userProgress: { none: { isCompleted: true } }`).

Thêm 1 endpoint chung:

- `POST /daily-session/activity-complete` `{ lessonId, activity: 'vocab'|'dialogue'|'exercises' }` → upsert UserProgress → set timestamp → derive isCompleted.

## Approaches evaluated

- **A. Wizard thống nhất** (CHỌN): route `/learn/:lessonId`, stepper 3 bước, tái dùng FlashcardCard/QuizCard + DialogueReader + ExerciseCard. Sạch + DRY. Nhược: thêm 1 trang, gom lại load data của 3 trang cũ.
- **B. Chuỗi 3 trang riêng + nút Tiếp tục**: giữ 3 trang, thêm nút. Ít UI mới. Nhược: 3 lần chuyển trang, trạng thái 3/3 phân tán.
- **C. Tái dùng /today làm vỏ wizard**: ít route mới. Nhược: refactor nặng, trộn concern ôn tập vs học bài.

## Final design (Approach A)

### Frontend
1. **Route mới** `/learn/:lessonId` (resolve theo order giống hook có sẵn).
2. **LessonWizard** — stepper 3 bước, mỗi bước là 1 stage:
   - Stage 1 Từ vựng: flashcard → quiz (tái dùng `FlashcardCard`/`QuizCard`).
   - Stage 2 Luyện nghe: `DialogueReader` (từ /today).
   - Stage 3 Exercises: `ExerciseCard` (từ lesson-exercises).
3. **Auto-detect hoàn thành** mỗi stage → `POST activity-complete`:
   - Từ vựng: hết flashcard + hết quiz.
   - Luyện nghe: pass 1 lượt (hook vào `recordDialogueReview` hoặc gọi activity-complete).
   - Exercises: mọi card đã `checked`.
4. Đủ 3 → hiện "Lesson hoàn thành" + nút sang bài kế.
5. **2 điểm vào**:
   - Khuyến nghị → `/learn/:currentLessonId` (first uncompleted, theo `getCurrentLesson`).
   - Tự chọn → `/hsk` (chọn level → bài, bài khóa bị disabled) → vào `/learn/:lessonId`.

### Backend
1. Migration: thêm 3 cột nullable vào `user_progress`.
2. `activity-complete` endpoint (service + controller + DTO).
3. `getCurrentLesson`/lock KHÔNG đổi.
4. Admin bypass KHÔNG đổi.

### Navigation
1. Xóa 3 nút nav ở header + mobile menu (giữ logo→home, avatar→profile, language toggle).
2. Trang chủ: hero "Bắt đầu học" → mở chooser 2 option + mục "Ôn tập" (due vocab + due dialogue → review flow hiện có).
3. Route cũ (/hsk, /vocabulary/study, /vocabulary/review, /today) giữ nguyên, chỉ ẩn khỏi nav.

## Implementation phases

1. Backend: migration + `activity-complete` endpoint + tests (lock vẫn xanh).
2. Frontend: LessonWizard + auto-detect 3 stage + gọi activity-complete.
3. Frontend: bỏ nav + trang chủ (chooser 2 option + mục ôn tập).
4. Wire 2 điểm vào + verify lock + admin bypass.

## Risks

- **Auto-detect edge cases**: user reset/uncheck sau khi xong — đánh dấu **sticky** (đã set không gỡ).
- **Migration prod**: thêm cột nullable = an toàn (không mất data, không lock table).
- **Legacy route**: vẫn truy cập được → không gãy bookmark; cần quyết có redirect về wizard hay không.
- **i18n**: thêm label cho chooser + stepper + "ôn tập".

## Success criteria

- Trang chủ chỉ hiện "bắt đầu học" + "ôn tập", không còn 3 nút nav.
- "Học ngay" hiện đúng 2 option.
- Khuyến nghị: vocab → luyện nghe → exercises, đủ 3 → mở lesson kế.
- Tự chọn: chọn bài (khóa disabled), chạy đúng luồng 3 giai đoạn.
- Lock tuần tự + admin bypass vẫn đúng.

## Unresolved questions

1. Chooser UX: modal vs full-screen inline? (default: modal nhỏ trên trang chủ)
2. Tên route: `/learn/:lessonId` vs `/lessons/:order/learn`?
3. Stage từ vựng: flashcard+quiz chạy **ép tuần tự** hay để user tự bật từng chế độ?
4. `lesson-detail-page`, `vocabulary-study-page`, `review-dashboard` — giữ legacy ẩn hay gộp/hướng về wizard?
