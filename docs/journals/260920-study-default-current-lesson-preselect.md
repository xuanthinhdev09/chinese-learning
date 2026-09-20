---
date: 2026-09-20
type: implementation-complete
topic: study-default-current-lesson-preselect
---

# Study default: pre-select bài đang học thay vì học cả level

## Context

Entry thứ 3 cùng ngày, đè lên working tree chưa commit của changeset study-mode-cleanup (journal riêng `260920-study-mode-cleanup-flashcard-quiz.md`). Vấn đề: `/vocabulary/study` khi user không bấm chip bài nào thì mặc định học **tất cả từ của level HSK** — vô lý với learner mới, vốn chỉ cần đúng bài đang theo tiến độ của tài khoản mình. Brainstorm duyệt trước ở `plans/reports/from-brainstormer-to-planner-study-default-current-lesson-260920-1302-report.md`, plan `plans/260920-1302-study-default-current-lesson`.

## What happened

User chốt 3 quyết định ngay từ đầu, không lan man: (1) tự **pre-select bài đang học** trong picker, (2) định nghĩa "bài đang học" = **bài chưa hoàn thành đầu tiên** — reuse `findNextLesson`, nhất quán với `/today` (một định nghĩa tiến độ duy nhất, không tự chế quy tắc mới), (3) áp dụng cả **Flashcard + Quiz**.

Implementation 2 đầu. Backend: thêm `GET /daily-session/current-lesson` — `DailySessionService.getCurrentLesson` resolve active course rồi `lesson.findFirst` select nhẹ `{id, title, order, courseId}`, **không include conversations** (payload nhỏ, picker chỉ cần tên bài). Where-clause extract thành `firstOpenLessonWhere()` dùng chung với `findNextLesson` — behavior cũ giữ nguyên y hệt, chỉ DRY hóa. Frontend: `getCurrentLesson()` api (đúng pattern apiClient) + pre-select `useEffect` trong `vocabulary-study-page.tsx` với **race-guard `userPickedRef`** (bấm tay luôn thắng fetch đang bay) + bỏ qua hẳn khi URL có sẵn `level`/`mode` params. Fallback null/course-missing → hành vi cũ (học cả level), không crash không treo.

## Key decisions

| Quyết định | Lý do |
|---|---|
| "Bài đang học" = reuse `findNextLesson` | Một định nghĩa tiến độ cho cả app; /today và /study không bao giờ lệch nhau |
| Where-clause extract `firstOpenLessonWhere()` | 2 select dùng chung điều kiện "bài chưa hoàn thành đầu tiên" — sửa một chỗ, DRY đúng chỗ nặng nhẹ |
| Race-guard `userPickedRef` + cancelled | Pre-select là async; nếu fetch về sau khi user đã bấm tay mà vẫn ghi đè là bug khó chịu loại kinh điển |
| Skip pre-select khi URL có params | URL là source of truth (bài học từ changeset trước) — deep-link phải thắng mặc định |
| Fallback im lặng về hành vi cũ | Không có bài đang học = không ép user; pre-select là convenience, không phải requirement |

## Verification

- Code-review subagent: **PASS 6/6 tiêu chí** — race-safety, `findNextLesson` unchanged, không xung đột với changeset study-mode-cleanup (cùng file `vocabulary-study-page.tsx` nhưng vùng khác), route không shadowing, apiClient pattern đúng
- Backend test **12/12 pass** (3 test mới cho `getCurrentLesson`)
- `nest build` + `vite build` pass

## Bài học

- **DRY where-clause ngay từ select thứ hai**: khi logic "bài chưa hoàn thành đầu tiên" cần ở 2 chỗ, extract là đúng — nhưng extract *where-clause* (dữ liệu truy vấn) chứ không ép chung cả shape select, vì 2 caller cần payload khác nhau.
- **Pre-select async luôn cần race-guard**: pattern `userPickedRef` (user intent) + `cancelled` (unmount) là bộ đôi tối thiểu cho mọi "fetch default rồi apply trừ khi user đã can thiệp".

## Next

1. **Chưa commit** — gộp chung đợt commit với changeset study-mode-cleanup (cùng file `vocabulary-study-page.tsx`, tách commit riêng sẽ confusion)
2. User test tay: vào `/vocabulary/study` sạch URL → picker chọn sẵn bài đang học; bấm chip khác → không bị ghi đè; deep-link có params → không pre-select

## Câu hỏi chưa giải quyết

- Không có blocker. Chờ user test tay trước khi commit gộp.
- Note: chỉ số quality Quiz ghi SM-2 (đúng=5/sai=1) thuộc changeset plan `260920-1125`, đã có journal riêng — đừng nhầm sang task này.
