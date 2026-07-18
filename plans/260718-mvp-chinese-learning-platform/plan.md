---
title: "MVP Chinese Learning Platform - Auth + Learning Basic"
description: "Build Chinese Learning Platform MVP with Authentication, HSK content structure, Lessons, Vocabulary, and Progress Tracking using NestJS, React, and PostgreSQL"
status: in-progress
priority: P1
branch: "main"
tags: [mvp, auth, chinese-learning, nestjs, react, postgresql]
blockedBy: []
blocks: []
created: "2026-07-18T04:48:53.370Z"
createdBy: "ck:plan"
source: skill
effort: "3-4 weeks"
---

# MVP Chinese Learning Platform - Auth + Learning Basic

## Overview

Build a minimum viable product for a Chinese Learning Platform focused on HSK 1-6 learning. The MVP enables users to:
- Register and authenticate (JWT + Refresh Token)
- Browse HSK levels and lessons
- View vocabulary with pinyin and meaning
- Track learning progress

**Tech Stack:** NestJS (Backend), React + TypeScript (Frontend), PostgreSQL + Prisma, Docker Compose (Infrastructure)

**Scope Boundary:** MVP excludes Quizzes, Grammar, Wrong Answer Review, Admin Panel, and Search functionality.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repository | Monorepo | Single project, easier coordination |
| Auth | JWT (15min) + Refresh Token (7d, DB) | Industry standard, secure |
| Database | 5 tables MVP | YAGNI - defer full schema |
| State | TanStack Query + Zustand | Server + client state separation |
| Infrastructure | Docker Compose | Simple local development |

## Database Schema (MVP)

```prisma
users              - id, email, username, passwordHash, avatar, deletedAt
refresh_tokens     - id, token, userId, expiresAt
hsk_levels         - id, level (1-6), name
lessons            - id, hskLevelId, title, description, order
vocabularies       - id, lessonId, hanzi, pinyin, meaning, audioUrl, example, wordType
user_progress      - id, userId, lessonId, isCompleted, completedAt
```

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Infrastructure Setup](./phase-01-infrastructure-setup.md) | ✅ Completed | 3-4 days |
| 2 | [Authentication Module](./phase-02-authentication-module.md) | ✅ Completed | 4-5 days |
| 3 | [Content Structure (HSK + Lessons)](./phase-03-content-structure-hsk-lessons.md) | Pending | 5-6 days |
| 4 | [Progress Tracking](./phase-04-progress-tracking.md) | Pending | 3-4 days |
| 5 | [Polish & Deploy](./phase-05-polish-deploy.md) | Pending | 3-4 days |

## Dependencies

**Cross-plan:** None (this is a greenfield project)

**External:**
- Docker Desktop installed locally
- Node.js 18+ for local fallback development

## Related Documentation

- **SRS:** `idea/Chinese_Learning_Platform_SRS.md`
- **Brainstorm Report:** `plans/reports/brainstorm-260718-mvp-chinese-learning-platform-report.md`

## Success Metrics

- [x] User can register and login with JWT tokens
- [ ] User can browse HSK levels and lessons
- [ ] User can view vocabulary per lesson
- [ ] User can mark lessons as completed
- [ ] Progress dashboard displays completed lessons
- [x] Docker environment runs locally with hot reload

## Validation Log

### Session 1 — 2026-07-18
**Trigger:** /ck:plan validate - Critical questions interview
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Authentication sử dụng JWT tokens lưu trong localStorage. Plan đã nhắc đến XSS risk nhưng defer httpOnly cookies. Bạn muốn implement httpOnly cookies ngay hay để sau?
   - Options: Tiếp tục localStorage | Dùng httpOnly cookies (Khuyên dùng) | Chỉ dùng localStorage
   - **Answer:** Dùng httpOnly cookies (Khuyên dùng)
   - **Rationale:** Bảo mật hơn cho refresh token, giảm XSS risk. Cần thêm CSRF protection cho backend.

2. **[Assumptions]** Plan yêu cầu Docker cho local development. Điều này có chấp nhận được không, hay nên cung cấp alternatives cho native setup?
   - Options: Docker bắt buộc | Native fallback (Khuyên dùng) | Docker optional + SQLite
   - **Answer:** Có, Docker là bắt buộc
   - **Rationale:** Giữ nguyên plan. Docker là requirement cho local development environment.

3. **[Tradeoffs]** API endpoints được định nghĩa mà không có versioning (ví dụ /auth/login). Có nên thêm API versioning (/api/v1/auth/login) ngay từ đầu không?
   - Options: Không versioning MVP (Khuyên dùng) | Thêm /api/v1/ prefix | Header-based versioning
   - **Answer:** Không versioning cho MVP (Khuyên dùng)
   - **Rationale:** Giữ URLs đơn giản. Thêm versioning khi có breaking changes trong tương lai.

4. **[Scope]** Testing được defer đến Phase 5 (Polish & Deploy) với scope hạn chế. Có nên tăng testing coverage trong development hay giữ nguyên?
   - Options: Test critical paths (Khuyên dùng) | Test mỗi module | Full TDD
   - **Answer:** Test critical paths thôi (Khuyên dùng)
   - **Rationale:** Giữ nguyên plan. Test auth flow và progress tracking trong Phase 5 là đủ cho MVP.

#### Confirmed Decisions
- **Token Storage:** httpOnly cookies cho refresh token (thay đổi từ localStorage) - Cần cập nhật Phase 2
- **Docker Requirement:** Bắt buộc cho local development - Giữ nguyên
- **API Design:** Không versioning cho MVP - Giữ nguyên
- **Testing Strategy:** Test critical paths trong Phase 5 - Giữ nguyên

#### Action Items
- [x] Cập nhật Phase 2: Thay đổi token storage từ localStorage sang httpOnly cookies
- [x] Thêm CSRF protection cho backend
- [ ] Document CSRF implementation trong Phase 2

#### Impact on Phases
- **Phase 2 (Auth Module):** ✅ ĐÃ CẬP NHẬT - Thay đổi từ localStorage sang httpOnly cookies, thêm CSRF protection, updated success criteria and security considerations

### Whole-Plan Consistency Sweep
- [x] Checked plan.md for stale localStorage references
- [x] Updated Phase 2 implementation steps (Auth Store now minimal)
- [x] Updated Phase 2 success criteria (httpOnly cookies, CSRF protection)
- [x] Updated Phase 2 risk assessment (CSRF added, XSS risk reduced)
- [x] Updated Phase 2 security considerations (cookie configuration added)
- [x] No contradictions found across plan files
- [ ] Validation complete - ready for implementation

## Out of Scope (Future Phases)

- Quizzes and question system
- Grammar points and explanations
- Wrong answer review system
- Admin panel for content management
- Search functionality
- History tracking beyond progress
- Audio hosting for vocabulary
