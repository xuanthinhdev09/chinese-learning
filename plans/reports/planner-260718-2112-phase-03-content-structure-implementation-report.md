# Phase 3: Content Structure Implementation - Planner Report

**Status:** DONE
**Date:** 2026-07-18
**Plan Location:** `plans/260718-2112-phase-03-content-structure/`

## Executive Summary

Created detailed implementation plan for Phase 3: Content Structure (HSK + Lessons). Plan includes 27 files (13 backend, 14 frontend), 3 backend modules, 4 frontend components, and seed data for HSK 1-2 levels with 5 lessons and 27 vocabulary items.

## Implementation Overview

### Backend Modules (3 days)

1. **HSK Module** - 4 files
   - `hsk.module.ts`, `hsk.controller.ts`, `hsk.service.ts`, `dto/hsk.dto.ts`
   - Endpoints: GET /hsk, GET /hsk/:id
   - Returns HSK levels with lesson counts

2. **Lessons Module** - 5 files
   - `lessons.module.ts`, `lessons.controller.ts`, `lessons.service.ts`, `dto/lesson.dto.ts`, `dto/lesson-query.dto.ts`
   - Endpoints: GET /lessons, GET /lessons/:id
   - Pagination support (page, limit query params)

3. **Vocabulary Module** - 4 files
   - `vocabulary.module.ts`, `vocabulary.controller.ts`, `vocabulary.service.ts`, `dto/vocabulary.dto.ts`
   - Endpoint: GET /vocabulary/lesson/:lessonId

### Frontend Implementation (2-3 days)

1. **API Clients** - 3 files
   - `hsk-api.ts`, `lessons-api.ts`, `vocabulary-api.ts`
   - Follow existing `auth-store.ts` pattern with fetch + credentials: include

2. **Components** - 4 files
   - `HskCard.tsx` - Color-coded by level (1-6), shows lesson count
   - `LessonCard.tsx` - Shows order, title, vocabulary count
   - `VocabularyCard.tsx` - Hanzi (large), pinyin (with tones), meaning
   - `VocabularyList.tsx` - Grid layout with loading states

3. **Pages** - 2 new, 2 updates
   - `hsk-list-page.tsx` - Replace placeholder with HSK grid
   - `hsk-detail-page.tsx` - NEW - Shows lessons for level
   - `lesson-detail-page.tsx` - Replace placeholder with vocabulary list

### Seed Data

- HSK 1: 3 lessons (Greetings, Numbers, Family)
- HSK 2: 2 lessons (Time, Dates)
- 27 vocabulary items with: hanzi, pinyin (tone marks), meaning, wordType, example

## Architecture Patterns Verified

**Backend Reference:** `backend/src/auth/auth.module.ts`
- Module structure: imports, controllers, providers, exports
- Public decorator for unauthenticated endpoints
- PrismaService injection pattern

**Frontend Reference:** `frontend/src/stores/auth-store.ts`
- API URL pattern with VITE_API_URL fallback
- Fetch with credentials: include
- Error handling with try/catch

## Prisma Schema Status

**Verified:** Models already exist in `backend/prisma/schema.prisma:46-113`
- `HskLevel` (id, level, name, description)
- `Lesson` (id, hskLevelId, title, description, order)
- `Vocabulary` (id, lessonId, hanzi, pinyin, meaning, audioUrl, example, wordType)
- Relations configured with Cascade deletes

## Key Design Decisions

1. **Public Endpoints** - Content doesn't require authentication (learning materials)
2. **Pagination** - Lessons support page/limit query params
3. **UTF-8 First** - Chinese characters and pinyin tone marks primary concern
4. **TanStack Query** - For frontend data fetching and caching
5. **YAGNI** - Deferred audio playback and search to post-MVP

## File Count Summary

**Create (27 files):**
- Backend: 13 (3 modules × 3-4 files each)
- Frontend: 14 (3 API clients + 4 components + 2 pages + routing)

**Modify (6 files):**
- `backend/src/app.module.ts`
- `backend/package.json`
- `backend/prisma/seed.ts`
- `frontend/src/pages/hsk/hsk-list-page.tsx`
- `frontend/src/pages/lessons/lesson-detail-page.tsx`
- `frontend/src/App.tsx`

## Success Criteria

Backend:
- [ ] API responses < 300ms
- [ ] Seed data creates 6 HSK levels, 5 lessons, 27 vocabularies
- [ ] Chinese characters return correctly (UTF-8)

Frontend:
- [ ] HSK grid shows all 6 levels
- [ ] Navigation: HSK → Lessons → Vocabulary works
- [ ] Pinyin tone marks display (ǎ, ē, etc.)

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| UTF-8 encoding | Test seed data early, verify in browser |
| Slow queries | Index on lessonId exists in schema |
| File growth > 200 lines | Split components, use composition |

## Dependencies

- **Blocks:** Phase 4 (Progress Tracking)
- **Requires:** Phase 1 (Infrastructure), Phase 2 (Authentication)
- **Estimated:** 5-6 days (3 backend, 2-3 frontend)

## Next Steps

1. Create implementation tasks from plan
2. Assign to fullstack-developer agent
3. Begin with HSK Module (Day 1)
4. Run seed data after all modules complete
