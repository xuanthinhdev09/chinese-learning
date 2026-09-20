# Brainstorm Report — Profile Edit Feature

**Date:** 2026-09-19 | **Status:** APPROVED by user | **Next:** /ck:plan

## Problem Statement

Trang `/profile` chỉ là view tĩnh. Nút "Chỉnh sửa profile" không có onClick (dead button). 4 ô thống kê hardcode số 0. Thiếu: edit username/avatar, stats thật, đổi mật khẩu.

## Requirements (đã chốt với user)

### In scope
1. **Edit username + avatar (emoji picker)** — inline edit tại `/profile`, không modal, không route riêng
2. **Stats thật cho 4 card** — định nghĩa:
   - Từ vựng đã học = count `UserVocabularyProgress` theo userId
   - Bài hoàn thành = count `UserProgress` isCompleted=true
   - Chuỗi ngày học = ngày liên tiếp có hoạt động tính tới hôm nay (nếu hôm nay chưa có, lùi từ hôm qua)
   - Ngày hoạt động = tổng số ngày distinct có hoạt động
   - Nguồn ngày hoạt động: `UserVocabularyProgress.lastReviewedAt` + `UserProgress.completedAt`
3. **Đổi mật khẩu** — form: mật khẩu cũ, mới, xác nhận; verify mật khẩu cũ bằng bcrypt

### Out of scope
- displayName / bio (cần migration)
- Đổi email
- Upload file avatar (chỉ emoji preset)
- Upload/storage backend

## Codebase Findings (scout)

- Backend **đã có** `PATCH /users/me` (`backend/src/users/users.controller.ts:33`) nhận `{username, avatar}`, check username unique, ẩn passwordHash → chỉ bổ sung validate avatar
- DB `User` (`schema.prisma:10`): `email`, `username`, `avatar String?` — không cần migration
- Frontend pattern hiện có: React Query (`useQuery`/`useMutation`) + service layer `src/api/*.ts` + zustand — thấy ở `hsk-list-page`, `lesson-detail-page`, `import/hooks/use-import-mutations.ts`
- `api-client.ts` có sẵn auto-refresh 401 (single-flight) → mọi call mới đi qua đây
- `auth-store.ts` có sẵn `setUser()` — thêm `updateUser(partial)` để sync header/mobile menu

## Evaluated Approaches

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A. React Query + service layer** | Nhất quán pattern pages hiện có; DRY với apiClient (auto-refresh); tách component nhỏ <200 lines | Nhiều file hơn chút | ✅ CHỌN |
| B. Zustand + fetch thuần (style auth-store login cũ) | Ít file hơn | Lệch pattern, tự xử lý 401 trùng logic apiClient, tech debt | ❌ |
| C. Modal / route riêng /profile/edit | — | User đã loại ở Discovery (chọn inline) | ❌ |

## Final Solution

### Backend — `backend/src/users/`

- `users.controller.ts`: thêm `GET /users/me/stats`, `PATCH /users/me/password`; PATCH me bổ sung validate avatar ∈ preset emoji list
- `users.service.ts`: thêm `getStats()` (2 count Prisma + compute streak/activeDays bằng JS — không raw SQL, data/user nhỏ), `changePassword()` (bcrypt.compare cũ → hash mới; sai → BadRequestException; không revoke session khác)
- Không đụng schema

### Frontend — `frontend/src/`

```
src/api/profile-api.ts                    → getStats, updateProfile, changePassword (qua apiClient)
src/pages/profile/
├── profile-page.tsx                      → compose (refactor file hiện tại)
├── profile-stats-grid.tsx                → useQuery stats
├── profile-edit-form.tsx                 → inline edit username + avatar, Lưu/Hủy
├── avatar-emoji-picker.tsx               → grid ~24 emoji preset (dùng chung list với backend validate)
├── change-password-form.tsx              → 3 input: cũ, mới, xác nhận
└── hooks/use-profile-hooks.ts            → useProfileStats, useUpdateProfile, useChangePassword
src/stores/auth-store.ts                  → thêm updateUser(partial)
```

Flow: nút "Chỉnh sửa profile" → card chuyển sang form → Lưu thành công quay về view mode, store sync.

## Acceptance Criteria

1. Sửa username lưu OK; username trùng → hiện lỗi, không save; header/mobile menu cập nhật ngay không cần reload
2. Chọn emoji avatar → hiển thị thay 👤 mọi nơi
3. 4 ô stats hiện số thật đúng định nghĩa; sai số = fail
4. Đổi password: sai mật khẩu cũ → lỗi rõ ràng không đổi; đúng → thành công, vẫn giữ đăng nhập, login lại bằng mật khẩu mới OK
5. Typecheck `tsc --noEmit` pass cả 2 phía

## Risks & Considerations

- **Preset emoji list duplicate** FE/BE → đặt list backend làm nguồn chuẩn, FE mirror; note trong plan
- **Streak timezone**: ngày hoạt động tính theo timezone server (UTC) — user ở Asia/Saigon có thể lệch. Giải pháp KISS: nhóm theo ngày local server, chấp nhận sai số ±1 ngày; ghi chú cho round sau
- **Password validate**: min-length phải match rule đăng ký hiện tại (planner cần check auth register DTO)
- **ValidationPipe global?** chưa verify — nếu không có thì validate thủ công trong service (theo style `updateProfile` hiện tại)

## Success Metrics

- Tất cả acceptance criteria pass
- Không regression auth flow (session 30 ngày vẫn hoạt động)

## Next Steps

1. `/ck:plan` tạo implementation plan từ report này
2. Implement theo plan → test → code review
