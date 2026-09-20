---
phase: 1
title: Backend Profile Endpoints
status: completed
priority: P2
effort: 3h
dependencies: []
---

# Phase 1: Backend Profile Endpoints

## Overview

Bổ sung 2 endpoint mới (`GET /users/me/stats`, `PATCH /users/me/password`) + validate avatar cho PATCH /users/me hiện có. Không đụng schema DB.

## Requirements

- Functional:
  - Stats: trả `{vocabularyLearned, lessonsCompleted, streakDays, activeDays}`
  - Password change: verify mật khẩu cũ → hash mới (bcrypt cost 12)
  - Avatar validate: thuộc preset emoji list
- Non-functional: pass JWT guard (module đã có), validation qua DTO (global ValidationPipe đã bật ở `main.ts:26`)

## Architecture

- `GET /users/me/stats` — aggregation trong service:
  - `vocabularyLearned` = `prisma.userVocabularyProgress.count({ where: { userId } })`
  - `lessonsCompleted` = `prisma.userProgress.count({ where: { userId, isCompleted: true } })`
  - Active days: fetch `lastReviewedAt` (vocab) + `completedAt` (progress) — 2 mảng nhỏ per user, group theo ngày (yyyy-mm-dd) bằng JS, không raw SQL
  - `activeDays` = số ngày distinct; `streakDays` = đếm lùi liên tiếp từ hôm nay (hôm nay chưa có hoạt động thì lùi từ hôm qua, streak kết thúc ở ngày đầu bị hở)
- `PATCH /users/me/password` — flow: load user (có passwordHash) → `bcrypt.compare(currentPassword, hash)` → sai thì `BadRequestException('Current password is incorrect')` → đúng thì `bcrypt.hash(newPassword, 12)` → update. KHÔNG revoke refresh token (giữ session, theo quyết định brainstorm)
- Avatar validate: preset emoji list là nguồn chuẩn đặt ở backend (`users/constants/avatar-emojis.ts`), frontend mirror

## Related Code Files

- Create: `backend/src/users/dto/update-profile.dto.ts` (username 3-20 ký tự — match `register.dto.ts:8-9`; avatar optional string)
- Create: `backend/src/users/dto/change-password.dto.ts` (currentPassword + newPassword: `@MinLength(8)` — match `register.dto.ts:13`)
- Create: `backend/src/users/constants/avatar-emojis.ts` (export mảng emoji preset ~24 item)
- Modify: `backend/src/users/users.controller.ts` — thêm 2 route + binding DTO cho PATCH me
- Modify: `backend/src/users/users.service.ts` — thêm `getStats()`, `changePassword()`, validate avatar trong `updateProfile()`

## Implementation Steps

1. Tạo `constants/avatar-emojis.ts` — mảng emoji (~24: 👤😊🇨🇳📚🎯🔥🐱🐼..."
2. Tạo 2 DTO với class-validator decorator (match rule register)
3. `users.service.ts`:
   - `getStats(userId)`: 4 Prisma queries (2 count + 2 select datetime) → compute activeDays/streakDays bằng helper private `computeActiveDayStats(dates: Date[])`
   - `changePassword(userId, currentPassword, newPassword)`: như Architecture. Lưu ý: fetch user bằng `prisma.user.findUnique` trực tiếp (không qua `findById` vì nó exclude passwordHash)
   - `updateProfile()`: thêm check avatar ∈ preset list (nếu `data.avatar !== undefined`), sai → `BadRequestException`
4. `users.controller.ts`: thêm `@Get('stats')`, `@Patch('password')`, bind DTO vào PATCH me
5. Compile check: `npx tsc --noEmit` trong `backend/`

## Success Criteria

- [ ] `GET /users/me/stats` trả đúng 4 số theo định nghĩa (test tay với user có/hoặc không có progress)
- [ ] `PATCH /users/me/password`: sai mật khẩu cũ → 400; đúng → login lại bằng mật khẩu mới OK, session hiện tại không bị đá
- [ ] `PATCH /users/me` với avatar không hợp lệ → 400; username trùng → 400 (giữ nguyên behavior cũ)
- [ ] `npx tsc --noEmit` backend pass

## Risk Assessment

- **Streak timezone**: group ngày theo giờ server (UTC). User VN lệch ±1 ngày ở biên. Chấp nhận theo quyết định brainstorm, ghi comment trong code hàm compute
- **User không có hoạt động nào**: streak = 0, activeDays = 0 — không crash (mảng rỗng)
