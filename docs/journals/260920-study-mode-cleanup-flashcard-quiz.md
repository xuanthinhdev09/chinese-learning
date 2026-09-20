---
date: 2026-09-20
type: implementation-complete
topic: study-mode-cleanup-flashcard-quiz
---

# Study mode cleanup: cắt 2 mode mock gãy, quiz ghi SM-2

## Context

Tiếp mạch entry i18n cùng ngày. Task dọn dẹp 4 mode ôn tập tại `/vocabulary/study` — brainstorm đã duyệt trước ở `plans/reports/from-brainstormer-to-planner-study-mode-cleanup-260920-1125-report.md`, plan `plans/260920-1125-study-mode-cleanup` 3 phase, xong trọn vẹn 20/09/2026.

## What happened

Audit lộ ra sự thật khó chịu: trong 4 mode study, **Fill Blank + Pinyin Match là mock gãy** — câu hỏi cứng `"这是___什么"`, distractor random, kẹt luôn không advance không feedback. Tồi hơn: user nhìn vào tưởng "tất cả option đều giống nhau" và đánh giá app kém, trong khi đám mock này nằm đó thành dead code lâu ngày. Quiz thì chạy được nhưng **không ghi SM-2 progress** — ôn xong như chưa ôn. Nút "Ôn tập từ đến hạn" ở `/vocabulary/review` cũng vô hiệu: pre-load store rồi navigate, nhưng study page luôn rơi về picker khi thiếu URL params → due vocab bị bỏ ngỏ.

Cắt còn **Flashcard + Quiz** (YAGNI, user chốt). Đụng tay: xóa `quiz-fill-blank.tsx` + `quiz-pinyin-match.tsx`; `StudyMode = 'flashcard' | 'quiz'`; `submitQuizAnswer` fire-and-forget `recordProgress` với `progressError` hiển thị qua `translateApiError`; `handleStartReview → navigate('/vocabulary/study?mode=flashcard&due=1')`, effect restore xử lý `due=1 → loadDueVocabularies(20)`. i18n: thêm `doTitle/dueScope` × 3 locale (EN plural `_one/_other`), xóa keys `fillBlank/pinyinMatch/nextArrow/wrongAnswer` khỏi vi/en/zh.

## Key decisions

| Quyết định | Lý do |
|---|---|
| Cắt Fill Blank + Pinyin Match thay vì sửa | Sửa mock = viết lại từ đầu mà không ai xin. YAGNI — 2 mode chạy thật là đủ |
| Quiz SM-2 mapping: đúng = quality 5, sai = 1 | Đơn giản mà đúng nhánh: quality 1 rơi vào fail branch của SM-2 (reviewer verify DTO `@Min(0)@Max(5)`, quality<3 = nhánh fail như "Again" — behaviorally identical dù value khác) |
| Review due qua URL param `?mode=flashcard&due=1` | Fix tận gốc: URL là source of truth, không dựa store pre-load rồi mong page tự hiểu |
| `recordProgress` fire-and-forget | Không block UX khi POST chậm; lỗi surface qua `progressError` thay vì nuốt im |

## Verification

- Code-review subagent: **PASS 6/6 acceptance criteria**. 2 finding LOW đã fix: `startQuiz` reset `progressError`; sửa comment "Again (1)" → "nhánh fail như Again" (giữ value 1 vì user chốt)
- `npm run build` (tsc + vite) pass
- Lint **skip** — eslint config missing, lỗi có sẵn của project, không phải do task này
- **Chưa commit** — user muốn test tay trước (quiz POST quality đúng, nút review due)

## Bài học

- **Mock UI placeholder lâu ngày thành dead code gây hiểu nhầm thật**: user tin app broken vì option broken. Placeholder phải đánh dấu rõ (disabled + "coming soon") hoặc xóa sớm — để im là tệ nhất.
- **Fire-and-forget vẫn phải reset `progressError` ở mọi entry point** load mới — entry point nào quên reset là lỗi cũ ám ảnh session mới. Rule: mỗi state async error đi kèm reset ở mọi path start.

## Next

1. **User test tay**: quiz POST quality đúng giá trị, nút "Ôn tập từ đến hạn" vào thẳng session
2. Test xong → commit (đang là working tree chưa stage)
3. ESLint config missing — pre-existing, nên sửa riêng task khác

## Câu hỏi chưa giải quyết

- Không có blocker. Chờ kết quả test tay của user trước khi commit.
