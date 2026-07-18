---
phase: 3
title: "Content Structure (HSK + Lessons)"
status: pending
priority: P1
effort: "5-6 days"
dependencies: [1, 2]
---

# Phase 3: Content Structure (HSK + Lessons)

## Overview

Implement content management system for HSK levels, lessons, and vocabulary. This includes backend CRUD modules, frontend display pages, and sample seed data for HSK 1-2 content.

## Requirements

**Functional:**
- Display all HSK levels (1-6) with lesson counts
- View lessons within an HSK level
- View lesson details with vocabulary list
- Display vocabulary with hanzi, pinyin, meaning
- Optional: Audio playback for vocabulary (deferred)
- Pagination for lesson lists
- Search vocabulary by hanzi/pinyin/meaning (deferred - MVP uses basic filter)

**Non-functional:**
- API response < 300ms
- Lazy loading for vocabulary lists
- Efficient queries with proper indexes

## Architecture

**Backend Modules:**
```
hsk/
├── hsk.module.ts
├── hsk.controller.ts
├── hsk.service.ts
└── dto/

lessons/
├── lessons.module.ts
├── lessons.controller.ts
├── lessons.service.ts
└── dto/

vocabulary/
├── vocabulary.module.ts
├── vocabulary.controller.ts
├── vocabulary.service.ts
└── dto/
```

**Frontend Pages:**
```
src/pages/hsk/
├── HskListPage.tsx
└── HskDetailPage.tsx

src/pages/lessons/
├── LessonListPage.tsx
└── LessonDetailPage.tsx

src/components/
├── HskCard.tsx
├── LessonCard.tsx
├── VocabularyCard.tsx
└── VocabularyList.tsx
```

## Related Code Files

**Create (Backend):**
```
backend/src/hsk/hsk.module.ts
backend/src/hsk/hsk.controller.ts
backend/src/hsk/hsk.service.ts
backend/src/hsk/dto/hsk.dto.ts
backend/src/lessons/lessons.module.ts
backend/src/lessons/lessons.controller.ts
backend/src/lessons/lessons.service.ts
backend/src/lessons/dto/lesson.dto.ts
backend/src/vocabulary/vocabulary.module.ts
backend/src/vocabulary/vocabulary.controller.ts
backend/src/vocabulary/vocabulary.service.ts
backend/src/vocabulary/dto/vocabulary.dto.ts
backend/prisma/schema.prisma (hsk_levels, lessons, vocabularies)
backend/prisma/seed.ts (sample HSK 1-2 data)
```

**Create (Frontend):**
```
frontend/src/pages/hsk/HskListPage.tsx
frontend/src/pages/hsk/HskDetailPage.tsx
frontend/src/pages/lessons/LessonListPage.tsx
frontend/src/pages/lessons/LessonDetailPage.tsx
frontend/src/components/hsk/HskCard.tsx
frontend/src/components/lessons/LessonCard.tsx
frontend/src/components/vocabulary/VocabularyCard.tsx
frontend/src/components/vocabulary/VocabularyList.tsx
frontend/src/api/hsk-api.ts
frontend/src/api/lessons-api.ts
frontend/src/api/vocabulary-api.ts
```

**Modify:**
```
backend/src/app.module.ts (import HskModule, LessonsModule, VocabularyModule)
backend/prisma/schema.prisma (add HSK models)
frontend/src/App.tsx (add routes)
```

## Implementation Steps

### Backend (3 days)

1. **Prisma Schema Update**
   - Add `HskLevel` model:
     ```prisma
     model HskLevel {
       id        String    @id @default(cuid())
       level     Int       @unique // 1-6
       name      String    // "HSK 1", "HSK 2", etc.
       createdAt DateTime  @default(now())
       updatedAt DateTime  @updatedAt
       lessons   Lesson[]
     }
     ```
   - Add `Lesson` model:
     ```prisma
     model Lesson {
       id          String    @id @default(cuid())
       hskLevelId  String
       title       String
       description String?
       order       Int       // Lesson order within HSK level
       createdAt   DateTime  @default(now())
       updatedAt   DateTime  @updatedAt
       hskLevel    HskLevel  @relation(fields: [hskLevelId], references: [id])
       vocabularies Vocabulary[]
       progress    UserProgress[]
       @@unique([hskLevelId, order])
       @@index([hskLevelId])
     }
     ```
   - Add `Vocabulary` model:
     ```prisma
     model Vocabulary {
       id       String   @id @default(cuid())
       lessonId String
       hanzi    String   // Chinese character
       pinyin   String   // Pronunciation
       meaning  String   // Vietnamese meaning
       audioUrl String?  // Optional audio
       example  String?  // Example sentence
       wordType String?  // noun, verb, etc.
       createdAt DateTime @default(now())
       updatedAt DateTime @updatedAt
       lesson   Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
       @@index([lessonId])
     }
     ```
   - Run migration: `npx prisma migrate dev --name add_content_models`

2. **HSK Module**
   - Create `hsk.service.ts`:
     - `findAll()` - Return all HSK levels with lesson counts
     - `findOne(id)` - Return HSK level with lessons
   - Create `hsk.controller.ts`:
     - GET `/hsk` - List all levels
     - GET `/hsk/:id` - Get level with lessons

3. **Lessons Module**
   - Create `lessons.service.ts`:
     - `findByHskLevel(hskLevelId, pagination)` - Paginated lesson list
     - `findOne(id)` - Lesson with vocabulary count
     - `findVocabularies(lessonId)` - Get vocabularies for lesson
   - Create `lessons.controller.ts`:
     - GET `/lessons` - Query by hskLevelId with pagination
     - GET `/lessons/:id` - Lesson detail
     - GET `/lessons/:id/vocabulary` - Vocabulary for lesson

4. **Vocabulary Module**
   - Create `vocabulary.service.ts`:
     - `findByLesson(lessonId)` - Get vocabularies for lesson
     - `search(query)` - Search by hanzi/pinyin/meaning (basic implementation)
   - Create `vocabulary.controller.ts`:
     - GET `/vocabulary/lesson/:lessonId` - Vocabularies by lesson
     - GET `/vocabulary/search` - Search endpoint (deferred or basic)

5. **DTOs**
   - `hsk.dto.ts` - HskResponseDto
   - `lesson.dto.ts` - LessonResponseDto, LessonQueryDto
   - `vocabulary.dto.ts` - VocabularyResponseDto

6. **Seed Data**
   - Create `prisma/seed.ts`:
     - HSK 1-2 levels
     - 3-5 sample lessons per level
     - 10-20 vocabularies per lesson
   - Add script to package.json: `"prisma":{"seed":"ts-node prisma/seed.ts"}}`

### Frontend (2-3 days)

7. **API Clients**
   - Create `src/api/hsk-api.ts`:
     - `getHskLevels()` - GET /hsk
     - `getHskLevel(id)` - GET /hsk/:id
   - Create `src/api/lessons-api.ts`:
     - `getLessons(hskLevelId, page)` - GET /lessons
     - `getLesson(id)` - GET /lessons/:id
   - Create `src/api/vocabulary-api.ts`:
     - `getVocabularyByLesson(lessonId)` - GET /lessons/:id/vocabulary

8. **HSK Pages**
   - Create `src/pages/hsk/HskListPage.tsx`:
     - Grid of HSK cards
     - Show lesson count per level
     - Click to view lessons
   - Create `src/pages/hsk/HskDetailPage.tsx`:
     - HSK level header
     - List of lessons with pagination
     - Click lesson to view detail

9. **Lesson Pages**
   - Create `src/pages/lessons/LessonDetailPage.tsx`:
     - Lesson title and description
     - Vocabulary list component
     - Back navigation
     - Mark as completed button (prep for Phase 4)

10. **Components**
    - `HskCard.tsx`:
      - Display HSK level number
      - Lesson count badge
      - Progress indicator (0% initially)
    - `LessonCard.tsx`:
      - Lesson title
      - Vocabulary count
      - Completion status badge
    - `VocabularyCard.tsx`:
      - Hanzi (large, prominent)
      - Pinyin (with tone marks)
      - Meaning (Vietnamese)
      - Optional: Audio button (placeholder)
    - `VocabularyList.tsx`:
      - Grid/list of vocabulary cards
      - Pagination or infinite scroll

11. **Routing**
    - Add routes to App.tsx:
      - `/hsk` - HskListPage
      - `/hsk/:id` - HskDetailPage
      - `/lessons/:id` - LessonDetailPage

12. **TanStack Query Integration**
    - Query keys for HSK, lessons, vocabulary
    - Cache configuration for content data
    - Prefetch HSK levels on app load

## Success Criteria

- [ ] HSK 1-6 levels display on home page
- [ ] Each HSK level shows correct lesson count
- [ ] Clicking HSK level shows its lessons
- [ ] Lessons display in correct order
- [ ] Lesson detail page shows all vocabulary
- [ ] Vocabulary displays hanzi, pinyin, meaning correctly
- [ ] Pagination works for lesson lists
- [ ] API responses under 300ms
- [ ] Seed data loads successfully
- [ ] Chinese characters display correctly (UTF-8)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chinese encoding issues | Medium | Ensure UTF-8 everywhere, test early |
| Slow queries with many vocabularies | Medium | Add indexes, implement pagination |
| Pinyin tone marks display | Low | Use Unicode characters, test display |
| Content structure changes | Low | Design schema with flexibility |

## Data Structure

**Sample HSK 1 Data:**
```
HSK 1
├── Lesson 1: Greetings (你好)
│   ├── 你好 (nǐ hǎo) - Xin chào
│   ├── 我 (wǒ) - Tôi
│   └── 你 (nǐ) - Bạn
├── Lesson 2: Numbers (数字)
│   ├── 一 (yī) - Một
│   ├── 二 (èr) - Hai
│   └── 三 (sān) - Ba
└── Lesson 3: Family (家庭)
```

## API Endpoints

```
GET /hsk
  Response: [{ id, level, name, lessonCount }]

GET /hsk/:id
  Response: { id, level, name, lessons: [...] }

GET /lessons?hskLevelId={id}&page={n}&limit={10}
  Response: { data: [...], total, page, limit }

GET /lessons/:id
  Response: { id, title, description, order, hskLevel, vocabularyCount }

GET /lessons/:id/vocabulary
  Response: [{ id, hanzi, pinyin, meaning, audioUrl?, example?, wordType? }]
```

## Next Steps

After this phase:
- Content structure is complete
- Users can browse all learning materials
- Ready for Phase 4: Progress tracking integration
- Seed data provides demo content for testing

## Notes

- Pinyin should include tone marks (ǎ, ē, etc.)
- Hanzi should use proper Chinese font
- Consider adding Pinyin tone number display option
- Audio URLs optional - defer audio hosting decision
- Search functionality can be simple string match for MVP
