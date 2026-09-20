---
phase: 3
title: Dashboard HSK Lesson Extraction
status: completed
priority: P2
effort: 3h
dependencies:
  - '1'
---

# Phase 3: Dashboard HSK Lesson Extraction

## Overview

Trích xuất text Dashboard, HSK list/detail, Lesson detail. Domain: `dashboard`, `hsk`, `lesson`.

## Requirements

- Functional: mọi label/empty-state/nút trong dashboard + HSK + lesson detail dùng `t()`
- Non-functional: KHÔNG dịch dữ liệu DB (tên level/lesson/vocab/đoạn hội thoại) — chỉ text khung giao diện

## Architecture

- `hsk-list-page` + `hsk-card`: label "HSK 1..6" giữ nguyên (tên riêng), mô tả/progress label dịch
- `hsk-detail-page`: các level bị disable có text giải thích (commit 3aad536) — cũng đưa vào key
- `lesson-detail-page` (4 string): nhãn section (Từ vựng, Hội thoại...) dịch; nội dung bên trong giữ DB
- `dashboard-page` (10 string): chào mừng có tên user → `t('dashboard.greeting', { name })`

## Related Code Files

- Modify: `frontend/src/pages/dashboard/dashboard-page.tsx`, `frontend/src/pages/hsk/hsk-list-page.tsx`, `frontend/src/pages/hsk/hsk-detail-page.tsx`, `frontend/src/pages/lessons/lesson-detail-page.tsx`, `frontend/src/components/hsk/hsk-card.tsx`, `frontend/src/components/lessons/lesson-card.tsx`
- Modify: `frontend/src/i18n/locales/vi.json` (thêm `dashboard`, `hsk`, `lesson`)
- Create: none

## Implementation Steps

1. Extract `dashboard`: greeting, stats labels (streak, số bài học...), CTA "Học hôm nay"
2. Extract `hsk`: card mô tả, nút vào học, disabled-level note, progress label
3. Extract `lesson`: section headings, nút quay lại, empty-state khi lesson trống
4. Build pass + tự test dashboard → HSK → lesson detail

## Success Criteria

- [ ] 0 string tiếng Việt hardcode trong files trên (trừ tên level "HSK n")
- [ ] Nội dung DB (tên lesson, vocab) hiển thị nguyên trạng mọi ngôn ngữ

## Risk Assessment

- Thấp. Chú ý phân biệt text UI vs data từ DB khi trích xuất — nếu lúng túng kiểm tra nguồn string (JSX literal vs API response)

## Security Considerations

- Không có
