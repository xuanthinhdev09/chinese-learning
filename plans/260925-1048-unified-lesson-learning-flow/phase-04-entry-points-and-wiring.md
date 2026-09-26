---
phase: 4
title: "Entry points and wiring"
status: completed
priority: P1
effort: "3h"
dependencies: [2, 3]
---

# Phase 4: Entry points and wiring

## Overview

Nối 2 điểm vào luồng wizard: "khuyến nghị" = auto bài đang học; "tự chọn" = chọn level → bài (bài khóa disabled). Verify lock tuần tự + admin bypass hoạt động xuyên suốt.

## Requirements

- Functional:
  - Chooser "Học theo khuyến nghị" → `/learn/:currentLessonId` (dùng `getCurrentLesson`).
  - Chooser "Tự chọn bài học" → `/hsk` (danh sách level → bài), bài bị khóa hiển thị disabled → không vào được.
  - Từ `/hsk` chọn bài → `/learn/:lessonId` (không phải `/lessons/:order` cũ).
  - <!-- Validation 260925-1048 --> Route cũ `/lessons/:order` + `/lessons/:order/exercises` redirect về `/learn/:lessonId`.
  - Lesson card trong HSK detail: locked → không click; mở → vào `/learn/:lessonId`.
  - Admin: mọi bài đều vào được (bỏ lock), giống hiện tại.
- Non-functional: giữ nguyên hook `use-resolve-hsk-level-id` / `use-resolve-lesson-id`.

## Architecture

```
DashboardPage chooser
  ├─ "Khuyến nghị" → getCurrentLesson() → navigate(`/learn/${lessonId}`)
  └─ "Tự chọn"    → navigate('/hsk')

HskDetailPage (đã có isAdmin + isLessonLocked)
  └─ LessonCard locked → không navigate; mở → navigate(`/learn/${lesson.id}`)

LessonLearnPage đủ 3 → nút "bài kế" → resolve bài kế (order hiện tại + 1) → /learn/:nextId

Legacy route: /lessons/:order [+ /exercises] → resolve id → <Navigate> /learn/:id
```

## Related Code Files

- Modify: `frontend/src/pages/dashboard/dashboard-page.tsx` (chooser handlers)
- Modify: `frontend/src/components/lessons/lesson-card.tsx` (onClick → /learn)
- Modify: `frontend/src/pages/hsk/hsk-detail-page.tsx` (điểm vào bài)
- Modify: `frontend/src/pages/lessons/lesson-learn-page.tsx` (nút "bài kế")
- Modify: `frontend/src/App.tsx` (redirect route cũ → /learn)

## Implementation Steps

1. Chooser "khuyến nghị": gọi `getCurrentLesson()`, navigate `/learn/:lessonId`; fallback về trang chủ nếu không có bài.
2. Chooser "tự chọn": navigate `/hsk`.
3. `lesson-card.tsx`: đổi `navigate(\`/lessons/${order}\`)` → `navigate(\`/learn/${lesson.id}\`)` (giữ `locked`).
4. `hsk-detail-page.tsx`: giữ logic `isLessonLocked`, chỉ đổi đích sang `/learn`.
5. `lesson-learn-page.tsx`: nút "bài kế" → resolve order kế → `/learn/:nextId` (hoặc về trang chủ nếu hết).
6. Redirect route cũ trong `App.tsx`: `/lessons/:order` + `/lessons/:order/exercises` → `use-resolve-lesson-id` resolve id → `<Navigate>` sang `/learn/:id`.
7. `npx tsc --noEmit` frontend → sạch.
8. Verify e2e: user thường bị lock đúng; admin vào được mọi bài.

## Success Criteria

- [ ] "Khuyến nghị" mở đúng bài đang học trong wizard.
- [ ] "Tự chọn" chọn bài đúng, bài khóa disabled.
- [ ] Từ HSK detail vào đúng `/learn/:lessonId`.
- [ ] Route cũ `/lessons/:order` + `/lessons/:order/exercises` redirect đúng về `/learn/:id`.
- [ ] Đủ 3 → chuyển bài kế đúng.
- [ ] Lock tuần tự + admin bypass đúng với mọi tài khoản.

## Risk Assessment

- **Không có bài đang học** (hoàn thành hết / chưa resolve course): fallback về trang chủ hoặc course mới nhất — xử lý rõ để tránh trang trắng.
- **order → id mapping**: dùng `lesson.id` (CUID) thay vì `order` ở route `/learn/:lessonId` để tránh nhầm khi resolve; `use-resolve-lesson-id` hỗ trợ cả 2 nhưng nên truyền id cho chính xác.
- **Admin bypass ở UI**: đảm bảo `isAdmin` vẫn chảy từ auth-store (đã có từ lần trước), không phụ thuộc lock server.
