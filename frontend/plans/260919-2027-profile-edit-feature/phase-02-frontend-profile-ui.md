---
phase: 2
title: Frontend Profile UI
status: completed
priority: P2
effort: 4h
dependencies:
  - 1
---

# Phase 2: Frontend Profile UI

## Overview

Refactor `/profile` thành compose components: inline edit form (username + avatar emoji), stats thật qua React Query, form đổi mật khẩu. Thêm service layer `src/api/profile-api.ts` theo pattern hiện có.

## Requirements

- Functional:
  - Nút "Chỉnh sửa profile" → toggle card profile sang edit mode; Lưu thành công → về view mode, store sync (header/menu cập nhật ngay)
  - Avatar: grid ~24 emoji preset (mirror backend list), chạm chọn
  - Đổi password: 3 input (cũ, mới, xác nhận) — validate match client-side trước khi gọi API
  - 4 ô stats: số thật từ `GET /users/me/stats`
- Non-functional: mọi file < 200 lines; mỗi call đi qua `apiClient` (auto-refresh 401); không fetch thuần

## Architecture

```
src/api/profile-api.ts                    → getProfileStats(), updateProfile(), changePassword() — qua apiClient
src/pages/profile/
├── profile-page.tsx                      → compose + state editMode (refactor từ file hiện tại)
├── profile-stats-grid.tsx                → useQuery(['profile-stats'])
├── profile-edit-form.tsx                 → form username + AvatarEmojiPicker, nút Lưu/Hủy
├── avatar-emoji-picker.tsx               → grid emoji, controlled component (value, onChange)
├── change-password-form.tsx              → form đổi mật khẩu, hiện/ẩn theo state (card riêng trong trang)
└── hooks/use-profile-hooks.ts            → useProfileStats (useQuery), useUpdateProfileMutation, useChangePasswordMutation
src/stores/auth-store.ts                  → thêm updateUser(partial: Partial<User>)
```

- Mutations: `onSuccess` của updateProfile → `useAuthStore.getState().updateUser(updated)` + `invalidateQueries(['profile-stats'])` nếu cần; changePassword onSuccess → clear form + toast/thông báo thành công inline
- Errors: `onError` parse message từ response (`Username already taken`, `Current password is incorrect`) → hiện inline dưới field
- Style: theo Tailwind tokens đang dùng (`bg-white dark:bg-gray-800`, `text-foreground`, `rounded-xl`...) — match style `profile-page.tsx` hiện tại

## Related Code Files

- Create: `frontend/src/api/profile-api.ts`
- Create: `frontend/src/pages/profile/profile-stats-grid.tsx`
- Create: `frontend/src/pages/profile/profile-edit-form.tsx`
- Create: `frontend/src/pages/profile/avatar-emoji-picker.tsx`
- Create: `frontend/src/pages/profile/change-password-form.tsx`
- Create: `frontend/src/pages/profile/hooks/use-profile-hooks.ts`
- Modify: `frontend/src/pages/profile/profile-page.tsx` (refactor thành compose)
- Modify: `frontend/src/stores/auth-store.ts` (thêm updateUser)

## Implementation Steps

1. `profile-api.ts`: 3 hàm qua `apiClient` (`GET /users/me/stats`, `PATCH /users/me`, `PATCH /users/me/password`) — xem `src/api/import-api.ts` làm mẫu
2. `auth-store.ts`: thêm `updateUser(user: Partial<User>)` — merge vào state
3. Hooks file: useQuery stats (staleTime ~1 phút), 2 mutations
4. `avatar-emoji-picker.tsx`: controlled grid, highlight emoji đang chọn
5. `profile-edit-form.tsx`: local state từ `useAuthStore().user`, validate client (username 3-20), gọi mutation, error inline
6. `change-password-form.tsx`: 3 input + confirm-match check client, gọi mutation
7. `profile-stats-grid.tsx`: thay 4 số 0, loading skeleton đơn giản
8. `profile-page.tsx`: compose tất cả, state `isEditing` toggle
9. Compile check: `npx tsc --noEmit` trong `frontend/`

## Success Criteria

- [ ] Sửa username + avatar lưu OK; header + mobile menu hiện giá trị mới ngay không reload
- [ ] Username trùng → message lỗi inline, không save
- [ ] 4 ô stats hiện số thật (đối chiếu với DB)
- [ ] Đổi password: confirm mismatch chặn client-side; sai mật khẩu cũ → lỗi inline; thành công → giữ đăng nhập
- [ ] `tsc --noEmit` frontend pass; mobile view không vỡ layout (menu z-index fix đã xong)

## Risk Assessment

- **Emoji list lệch giữa FE/BE**: backend là nguồn chuẩn, FE mirror — nếu lệch, backend 400 → error inline vẫn handle được
- **Stats cache stale sau khi học từ mới**: invalidate `['profile-stats']` khi quay lại page (staleTime ngắn là đủ cho MVP)
