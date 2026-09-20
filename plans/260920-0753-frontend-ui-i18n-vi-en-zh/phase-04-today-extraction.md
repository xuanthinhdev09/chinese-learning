---
phase: 4
title: Today Extraction
status: completed
priority: P1
effort: 5h
dependencies:
  - '1'
---

# Phase 4: Today Extraction

## Overview

Trích xuất nhóm Daily Session `/today` — domain `today`. Nặng nhất: `dialogue-reader` ~44 string, tổng ~130 string cả nhóm.

## Requirements

- Functional: toàn bộ controls, hints, summary, group-select dùng `t()`
- Non-functional: KHÔNG đụng lyrics/dialogue/pinyin (nội dung DB); giữ nguyên logic TTS + spaced repetition

## Architecture

- Files: `today-session-page` (19), `dialogue-reader` (44), `dialogue-controls` (18), `lyrics-panel` (17), `group-select` (10), `session-summary` (8), `speed-control` (7), `practice-runner` (6), `lyrics-layer-toggles` (5)
- Bottom action bar + segment dropdown mobile (commit 2ead6b5) — label dịch qua key
- String có số liệu → interpolation: `t('today.summary.reviewedIn', { count })`, `t('today.dialogue.lineOf', { current, total })`
- Plural (nếu có "1 từ / n từ"): dùng i18next plural suffix `_one`/`_other` — vi chỉ cần `_other`, en cần cả hai

## Related Code Files

- Modify: `frontend/src/pages/today/today-session-page.tsx`, `frontend/src/components/today/dialogue-reader.tsx`, `dialogue-controls.tsx`, `lyrics-panel.tsx`, `lyrics-layer-toggles.tsx`, `group-select.tsx`, `session-summary.tsx`, `speed-control.tsx`, `practice-runner.tsx`
- Modify: `frontend/src/i18n/locales/vi.json` (thêm `today`)
- Create: none

## Implementation Steps

1. Extract theo file nhỏ trước (speed-control, lyrics-layer-toggles, practice-runner) để chốt pattern
2. `session-summary` — cẩn thận câu ghép số liệu, chuyển sang interpolation thay nối chuỗi
3. `group-select` + `dialogue-controls` + `lyrics-panel`
4. `dialogue-reader` (to nhất, làm cuối)
5. `today-session-page` + bottom action bar
6. Build pass + chạy thử 1 session `/today` đủ vòng: chọn nhóm → đọc dialogue → practice → summary

## Success Criteria

- [ ] 0 string tiếng Việt hardcode trong 9 files trên (ngoài dữ liệu DB)
- [ ] Interpolation đúng mọi chỗ có số (summary, line counter) — không còn nối chuỗi
- [ ] Session flow hoạt động nguyên trạng sau khi thay

## Risk Assessment

- Vừa: file lớn, dễ sót string trong điều kiện/aria-label. Mitigation: grep `[À-ỹ]` từng file sau khi thay

## Security Considerations

- Không có
