---
phase: 3
title: "Verify And Test"
status: pending
priority: P2
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Verify And Test

## Overview

Kiểm thử toàn bộ acceptance criteria trên cả backend + frontend bằng test thủ công qua UI + API, sau đó code review.

## Requirements

- Chạy đủ typecheck cả 2 phía
- Verify 5 acceptance criteria tổng của plan
- Không fake data/mock để pass — test với DB thật (tunnel local 5433 → VPS)

## Related Code Files

- Read all: phase 1 + 2 outputs
- Backend test command: `npx tsc --noEmit` trong `backend/` (chưa có test suite — verify bằng API calls thật)

## Implementation Steps

1. Typecheck: `npx tsc --noEmit` cả `backend/` + `frontend/`
2. Backend API test (curl/Insomnia, JWT từ login thật):
   - `GET /users/me/stats` với user mới (0,0,0,0) + user có data → đối chiếu psql
   - `PATCH /users/me` đổi username trùng → 400; avatar lạ → 400
   - `PATCH /users/me/password` sai mật khẩu cũ → 400; đúng → login lại bằng mật khẩu mới OK; session cũ vẫn gọi được `/users/me`
3. Frontend E2E thủ công (dev server + tunnel DB):
   - Sửa username/avatar → header + mobile menu sync ngay
   - 4 ô stats hiện đúng
   - Đổi password flow trọn vẹn qua UI
4. Regression: login/logout/refresh session (30 ngày) vẫn hoạt động — vì đụng users module cạnh auth
5. Code review (code-reviewer agent) → fix findings
6. Commit theo conventional commits (`feat(profile): ...`), tách backend/frontend nếu gọn

## Success Criteria

- [ ] Tất cả acceptance criteria trong plan.md pass với DB thật
- [ ] Không regression auth flow
- [ ] Code review hoàn tất, findings nghiêm trọng đã fix
- [ ] Commit sạch, không chứa credentials

## Risk Assessment

- **Test trên DB thật**: đổi password user test xong phải nhớ mật khẩu mới (dùng user test riêng, không phải user chính)
- **Streak sai lệch biên ngày**: nếu số streak nhìn thấy vô lý, check trước timezone (đã chấp nhận trong phase 1) trước khi "sửa"
