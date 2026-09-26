---
phase: 3
title: "Navigation and homepage"
status: completed
priority: P2
effort: "3h"
dependencies: [2]
---

# Phase 3: Navigation and homepage

## Overview

Xóa 3 nút nav ở header + mobile menu. Trang chủ trở thành điểm vào duy nhất: hero "bắt đầu học" mở chooser 2 option, kèm mục "ôn tập" (due review). Các route cũ giữ nguyên, chỉ ẩn khỏi nav.

## Requirements

- Functional:
  - Header desktop: bỏ 3 nút (Hôm nay, Trình độ HSK, Từ Vựng). Giữ logo→trang chủ, avatar→profile, language toggle.
  - Mobile menu: bỏ 3 item tương ứng, giữ profile + language.
  - Trang chủ: hero "bắt đầu học" → mở chooser gồm:
    - "Học theo khuyến nghị" → vào bài đang học.
    - "Tự chọn bài học" → vào `/hsk`.
  - Mục "ôn tập": hiện số từ + hội thoại đến hạn → dẫn vào review flow có sẵn (`/vocabulary/review` / due dialogue).
  - Route cũ (`/hsk`, `/vocabulary/study`, `/vocabulary/review`, `/today`) giữ nguyên, không xóa.
- Non-functional: không phá breadcrumb/scroll hiện có.

## Architecture

```
Header (header.tsx)         → bỏ <nav> 3 nút
MobileMenu (mobile-menu.tsx) → bỏ mainNavItems
DashboardPage               → hero "bắt đầu học" mở chooser (modal) + section "ôn tập"
  Chooser (modal inline)     → 2 nút: khuyến nghị (điều hướng sang /learn/:current) | tự chọn (/hsk)
```

Điểm vào luồng mới được nối ở Phase 4; Phase 3 chỉ dựng chooser + nút (điều hướng tạm).

## Related Code Files

- Modify: `frontend/src/components/layout/header/header.tsx`
- Modify: `frontend/src/components/layout/mobile-menu.tsx`
- Modify: `frontend/src/pages/dashboard/dashboard-page.tsx`
- Modify: `frontend/src/i18n/locales/{en,vi,zh}.json` (i18n label mới: chooser, ôn tập) <!-- Validation 260925-1048: fix path src/locales → src/i18n/locales -->

## Implementation Steps

1. Bỏ `<nav>` 3 nút trong `header.tsx` (giữ logo + user menu + language).
2. Bỏ `mainNavItems` 3 item trong `mobile-menu.tsx`.
3. Thêm chooser (modal/inline) trong `dashboard-page.tsx`: 2 option + đóng mở.
4. Thêm section "ôn tập": đọc `getDailySession()` (đã có) lấy `dueVocabularyTotal` + `dueDialogues.length`, render chip dẫn vào review.
5. Thêm key i18n (vi/en/zh) cho các label mới.
6. `npx tsc --noEmit` frontend → sạch; QA: header/mobile không còn 3 nút, trang chủ hiện chooser + ôn tập.

## Success Criteria

- [ ] Header + mobile menu không còn 3 nút nav.
- [ ] Trang chủ hiện "bắt đầu học" mở chooser đúng 2 option.
- [ ] Mục "ôn tập" hiện số từ/hội thoại đến hạn.
- [ ] Các route cũ vẫn truy cập trực tiếp được.
- [ ] i18n đủ 3 ngôn ngữ, không label rỗng.

## Risk Assessment

- **Người dùng cũ mất lối tắt**: route vẫn tồn tại (bookmark/back không gãy), chỉ ẩn nav — chấp nhận theo yêu cầu.
- **i18n thiếu key**: thêm đủ vi/en/zh, kiểm tra 3 ngôn ngữ.
- **Chooser UX**: mặc định modal nhỏ; nếu muốn full-screen sẽ đổi sau — không chặn.
