---
phase: 1
title: i18n Infrastructure
status: completed
priority: P1
effort: 2h
dependencies: []
---

# Phase 1: i18n Infrastructure

## Overview

Nền tảng react-i18next: cài dep, config i18n, store ngôn ngữ UI, toggle VI/EN/ZH ở Header (desktop + mobile), hàm `translateApiError`, seed `vi.json` với nhóm `common` + `errors`.

## Context Links

- [Brainstorm report](../reports/brainstorm-260920-0753-frontend-ui-i18n-vi-en-zh-report.md) — design đã duyệt

## Requirements

- Functional: đổi ngôn ngữ ở Header cập nhật UI tức thì; persist qua refresh; lần đầu luôn `vi`
- Non-functional: không detect browser; không đụng `language-preference-store` (store nội dung bài học)

## Architecture

- `frontend/src/i18n/index.ts`: init i18next — `lng` đọc từ ui-language-store (zustand persist localStorage rehydrate sync), `fallbackLng: 'vi'`, `interpolation.escapeValue: false` (React đã escape). Import trong `main.tsx` trước render App
- `frontend/src/stores/ui-language-store.ts`: zustand persist, state `{ lang: 'vi' | 'en' | 'zh' }`, action `setLang` gọi `i18n.changeLanguage` + set `document.documentElement.lang`
- `frontend/src/i18n/locales/{vi,en,zh}.json`: nested 2 cấp theo domain. Phase này chỉ seed `common` + `errors` (en/zh để trống, fallback vi)
- `frontend/src/utils/translate-api-error.ts`: `translateApiError(err: unknown, t: TFunction): string` — map message đã biết → key, không map được → `err.message` / fallback chung

## Related Code Files

- Create: `frontend/src/i18n/index.ts`, `frontend/src/i18n/locales/vi.json`, `frontend/src/i18n/locales/en.json`, `frontend/src/i18n/locales/zh.json`, `frontend/src/stores/ui-language-store.ts`, `frontend/src/utils/translate-api-error.ts`, `frontend/src/components/layout/language-toggle/language-toggle.tsx`
- Modify: `frontend/src/main.tsx` (import i18n), `frontend/package.json` (deps), `frontend/src/components/layout/header/header.tsx`, `frontend/src/components/layout/mobile-menu.tsx`
- Delete: none

## Implementation Steps

1. `npm install i18next react-i18next` trong `frontend/`
2. Tạo `ui-language-store.ts` (pattern copy từ `language-preference-store.ts` — zustand persist)
3. Tạo `i18n/index.ts` + 3 locale JSON seed `common` (`common.loading`, `common.error`, `common.save`, `common.cancel`, `common.close`, `common.retry`...) + `errors` (`invalidCredentials`, `usernameTaken`, `invalidAvatar`, `wrongPassword`, `invalidRefreshToken`, `refreshExpired`, `networkError`, `unknown`)
4. Tạo `translate-api-error.ts` với map: `Invalid credentials`→`errors.invalidCredentials`, `Username already taken`→`errors.usernameTaken`, `Invalid avatar selection`→`errors.invalidAvatar`, `Current password is incorrect`→`errors.wrongPassword`, `Invalid refresh token`/`Refresh token expired`→tương ứng
5. Import `./i18n` ở đầu `main.tsx`
6. Tạo `language-toggle.tsx` segmented VI/EN/ZH, gắn vào Header cạnh user menu + vào mobile menu
7. Build pass

## Success Criteria

- [ ] Build pass, app chạy như cũ (tiếng Việt)
- [ ] Toggle ở Header đổi được `document.documentElement.lang` + persist qua refresh
- [ ] `translateApiError` unit-testable (hàm thuần, không side effect)

## Risk Assessment

- Zustand persist rehydrate sync với localStorage — nếu async thì i18n init đọc `localStorage.getItem` trực tiếp trong `i18n/index.ts`. Verify khi làm.

## Security Considerations

- `escapeValue: false` an toàn vì React tự escape JSX interpolation; KHÔNG dùng dangerouslySetInnerHTML với t()
