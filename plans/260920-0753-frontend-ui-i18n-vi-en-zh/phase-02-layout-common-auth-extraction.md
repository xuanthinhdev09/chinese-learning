---
phase: 2
title: Layout Common Auth Extraction
status: completed
priority: P1
effort: 3h
dependencies:
  - '1'
---

# Phase 2: Layout Common Auth Extraction

## Overview

Trích xuất text của layout (header, breadcrumbs, menu, protected-layout), common UI (modal, empty-state, loading), và auth (login, register) sang key. Domain: `nav`, `auth`, `common`.

## Requirements

- Functional: mọi label/placeholder/error text trong các file dưới dùng `t()`
- Non-functional: giữ nguyên hành vi, chỉ thay string

## Architecture

- Dùng `useTranslation()` hook trong component. Với text ngoài JSX (toast, error string) dùng `t` trả về từ hook
- Breadcrumbs (`breadcrumbs.tsx`, 15 dòng VN) có label động theo route — map route → key, không dịch tên lesson từ DB
- `protected-layout.tsx` có text redirect/notify

## Related Code Files

- Modify: `frontend/src/components/layout/header/header.tsx`, `frontend/src/components/layout/mobile-menu.tsx`, `frontend/src/components/layout/menu-item.tsx`, `frontend/src/components/layout/breadcrumbs/breadcrumbs.tsx`, `frontend/src/components/layout/protected-layout.tsx`, `frontend/src/components/common/empty-state/empty-state.tsx`, `frontend/src/components/ui/modal/modal.tsx`, `frontend/src/pages/auth/login-page.tsx`, `frontend/src/pages/auth/register-page.tsx`
- Modify: `frontend/src/i18n/locales/vi.json` (thêm domain `nav`, `auth`, bổ sung `common`)
- Create: none

## Implementation Steps

1. Extract `nav`: menu items (Trang chủ, Học hôm nay, Từ vựng, Hồ sơ...), breadcrumbs labels
2. Extract `auth`: login/register — title, placeholder email/mật khẩu, nút submit, link chuyển trang, error fallback ('Đăng nhập thất bại' → dùng `translateApiError`)
3. Extract `common`: modal confirm text, empty-state default
4. Login/register chuyển sang `translateApiError(err, t)` thay `err.message` raw
5. Build pass + tự test flow login/register/register-sai-thông-tin

## Success Criteria

- [ ] 0 string tiếng Việt hardcode còn lại trong các file trên
- [ ] Login lỗi "Invalid credentials" hiện message từ key `errors.invalidCredentials` (đang là tiếng Việt từ vi.json)

## Risk Assessment

- Thấp — file nhỏ, pattern lặp

## Security Considerations

- Không log token/password vào error message
