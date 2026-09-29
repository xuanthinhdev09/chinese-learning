---
phase: 3
title: Frontend dialogue English display
status: completed
priority: P2
effort: 1h
dependencies:
  - 2
---

# Phase 3: Frontend hiển thị English cho hội thoại

## Overview

Hiển thị nghĩa hội thoại theo ngôn ngữ UI (en → English, vi → Vietnamese), tái dùng `getDisplayMeaning`.

## Requirements

- Functional: chọn EN → dòng hội thoại hiển thị English; VI → Vietnamese.
- Non-functional: toggle nghĩa vẫn hoạt động (show/hide), build pass.

## Related Code Files

- Modify: `frontend/src/api/daily-session.ts` (`DialogueLine` thêm `english?: string | null`)
- Modify: `frontend/src/components/today/lyrics-panel.tsx` (`{line.vietnamese}` → `getDisplayMeaning(vietnamese, english, preference)`)
- Modify (nếu cần): `frontend/src/components/today/dialogue-reader.tsx`, `lyrics-layer-toggles.tsx` (label toggle nghĩa)
- Modify: `frontend/src/i18n/locales/vi.json`, `en.json` (label toggle nghĩa → "Nghĩa"/"Meaning" nếu đổi)

## Implementation Steps

1. `daily-session.ts` `DialogueLine`: thêm `english?: string | null`.
2. `lyrics-panel.tsx`: thêm `useContentPreference`; nghĩa hiển thị = `getDisplayMeaning(line.vietnamese, line.english || '', preference)`.
3. Rà `dialogue-reader.tsx` + grep `.vietnamese` — chỗ nào còn hiển thị trực tiếp thì chuyển sang `getDisplayMeaning`.
4. Label toggle `showVietnamese` (i18n `today.lyrics.meaningToggle`) đổi thành "Nghĩa"/"Meaning" (giữ toggle chỉ show/hide nghĩa theo ngôn ngữ active).
5. `tsc --noEmit` + restart frontend.

## Success Criteria

- [ ] Chọn EN → hội thoại hiển thị English; VI → Vietnamese.
- [ ] Toggle nghĩa vẫn show/hide đúng.
- [ ] Frontend tsc pass.

## Risk Assessment

- Toggle `showVietnamese` hiện gắn với nghĩa Việt → đổi semantics sang "nghĩa theo ngôn ngữ UI" (nhỏ, cần kiểm tra label).
- `line.english` null với dòng chưa dịch → `getDisplayMeaning` fallback Vietnamese (đúng).
