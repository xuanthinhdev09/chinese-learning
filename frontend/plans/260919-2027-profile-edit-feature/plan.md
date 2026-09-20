---
title: Profile Edit Feature
description: 'Edit username + avatar emoji, stats thật cho 4 card, đổi mật khẩu'
status: pending
priority: P2
branch: main
tags:
  - profile
  - users
  - frontend
  - backend
blockedBy: []
blocks: []
created: '2026-09-19T13:34:47.758Z'
createdBy: 'ck:plan'
source: skill
---

# Profile Edit Feature

## Overview

Trang `/profile` hiện là view tĩnh: nút "Chỉnh sửa profile" không có onClick, 4 ô thống kê hardcode số 0, không đổi được mật khẩu. Plan này bổ sung: inline edit (username + avatar emoji picker), stats thật qua endpoint tổng hợp, đổi mật khẩu.

Thiết kế đã được brainstorm + user duyệt. Chi tiết đầy đủ: [brainstorm report](../reports/from-brainstorm-to-planner-260919-2027-profile-edit-feature-report.md)

## Context Links

- Brainstorm report: `frontend/plans/reports/from-brainstorm-to-planner-260919-2027-profile-edit-feature-report.md`
- Backend sẵn có: `backend/src/users/users.controller.ts` (PATCH /users/me), `backend/src/users/users.service.ts`
- Auth patterns: `backend/src/auth/auth.service.ts` (bcrypt cost 12), `backend/src/auth/dto/register.dto.ts` (username 3-20, password min 8)
- Frontend patterns: `frontend/src/pages/import/hooks/use-import-mutations.ts` (React Query), `frontend/src/lib/api-client.ts` (auto-refresh 401)
- Schema: `backend/prisma/schema.prisma` — User có `avatar String?`, **không cần migration**

## Decisions (đã chốt với user)

1. Fields: username + avatar emoji preset (không upload file, không displayName/bio, không đổi email)
2. UI: inline edit tại `/profile` (không modal, không route riêng)
3. Stats: giữ 4 card, định nghĩa đủ (streak + active days tính từ ngày hoạt động)
4. Đổi password trong scope
5. Frontend: React Query + service layer `src/api/` (KHÔNG fetch thuần trong store)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend Profile Endpoints](./phase-01-backend-profile-endpoints.md) | Completed |
| 2 | [Frontend Profile UI](./phase-02-frontend-profile-ui.md) | Completed |
| 3 | [Verify And Test](./phase-03-verify-and-test.md) | Pending |

## Dependencies

- Phase 2 phụ thuộc Phase 1 (cần endpoints chạy được trước khi wire UI)
- Không có cross-plan dependency (plan MVP tháng 7 là umbrella cũ, không block)

## Acceptance Criteria (tổng)

1. Sửa username lưu OK; trùng → lỗi rõ ràng; header/mobile menu sync ngay
2. Chọn emoji avatar → hiển thị thay 👤 mọi nơi
3. 4 ô stats hiện số thật đúng định nghĩa
4. Đổi password: sai mật khẩu cũ → lỗi; đúng → giữ session, login lại bằng mật khẩu mới OK
5. `tsc --noEmit` pass cả backend + frontend
