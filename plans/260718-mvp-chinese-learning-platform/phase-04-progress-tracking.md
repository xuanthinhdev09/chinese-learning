---
phase: 4
title: "Progress Tracking"
status: pending
priority: P1
effort: "3-4 days"
dependencies: [1, 2, 3]
---

# Phase 4: Progress Tracking

## Overview

Implement user progress tracking system allowing users to mark lessons as completed and view their learning progress on a dashboard. This includes backend progress CRUD, frontend dashboard, and progress visualization.

## Requirements

**Functional:**
- Mark lesson as completed/incomplete
- Track completion timestamp
- View overall progress (completed/total lessons)
- View progress per HSK level
- Progress dashboard with statistics
- User profile page with avatar and stats
- Progress persistence across sessions

**Non-functional:**
- Instant completion toggle feedback
- Efficient progress queries (< 100ms)
- Optimistic UI updates

## Architecture

**Backend Module:**
```
progress/
├── progress.module.ts
├── progress.controller.ts
├── progress.service.ts
└── dto/
```

**Frontend:**
```
src/pages/progress/
└── ProgressDashboard.tsx

src/pages/profile/
└── ProfilePage.tsx

src/components/progress/
├── ProgressCard.tsx
├── HskProgressCard.tsx
└── ProgressBar.tsx

src/api/progress-api.ts
```

## Related Code Files

**Create (Backend):**
```
backend/src/progress/progress.module.ts
backend/src/progress/progress.controller.ts
backend/src/progress/progress.service.ts
backend/src/progress/dto/progress.dto.ts
backend/prisma/schema.prisma (user_progress model)
```

**Create (Frontend):**
```
frontend/src/pages/progress/ProgressDashboard.tsx
frontend/src/pages/profile/ProfilePage.tsx
frontend/src/components/progress/ProgressCard.tsx
frontend/src/components/progress/HskProgressCard.tsx
frontend/src/components/progress/ProgressBar.tsx
frontend/src/api/progress-api.ts
```

**Modify:**
```
backend/prisma/schema.prisma (add UserProgress model)
backend/src/app.module.ts (import ProgressModule)
frontend/src/pages/lessons/LessonDetailPage.tsx (add completion button)
frontend/src/App.tsx (add progress/profile routes)
```

## Implementation Steps

### Backend (2 days)

1. **Prisma Schema Update**
   - Add `UserProgress` model:
     ```prisma
     model UserProgress {
       id          String    @id @default(cuid())
       userId      String
       lessonId    String
       isCompleted Boolean   @default(false)
       completedAt DateTime?
       createdAt   DateTime  @default(now())
       updatedAt   DateTime  @updatedAt
       user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
       lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
       @@unique([userId, lessonId])
       @@index([userId])
       @@index([lessonId])
     }
     ```
   - Update User model with progress relation:
     ```prisma
     model User {
       // ... existing fields
       progress UserProgress[]
     }
     ```
   - Run migration: `npx prisma migrate dev --name add_user_progress`

2. **Progress Service**
   - Create `progress.service.ts`:
     - `getUserProgress(userId)` - All progress entries
     - `getProgressByLesson(userId, lessonId)` - Single lesson status
     - `toggleLessonComplete(userId, lessonId)` - Toggle completion
     - `getOverallStats(userId)` - Total completed, total lessons, percentage
     - `getHskStats(userId, hskLevelId)` - Stats per HSK level
     - `getCompletedLessons(userId)` - List of completed lesson IDs

3. **Progress Controller**
   - Create `progress.controller.ts`:
     - GET `/progress/me` - Current user's all progress
     - GET `/progress/stats` - Overall statistics
     - GET `/progress/hsk/:hskId` - Stats for specific HSK level
     - POST `/progress/complete` - Mark lesson as completed
     - DELETE `/progress/complete/:lessonId` - Mark lesson as incomplete
   - All routes protected with JwtAuthGuard

4. **DTOs**
   - `progress.dto.ts`:
     - `ProgressResponseDto` - id, userId, lessonId, isCompleted, completedAt
     - `StatsResponseDto` - totalLessons, completedLessons, percentage
     - `CompleteLessonDto` - lessonId
     - `HskStatsResponseDto` - hskLevel, completed, total, percentage

### Frontend (1-2 days)

5. **Progress API Client**
   - Create `src/api/progress-api.ts`:
     - `getMyProgress()` - GET /progress/me
     - `getStats()` - GET /progress/stats
     - `getHskStats(hskId)` - GET /progress/hsk/:hskId
     - `markComplete(lessonId)` - POST /progress/complete
     - `markIncomplete(lessonId)` - DELETE /progress/complete/:lessonId

6. **Progress Dashboard**
   - Create `src/pages/progress/ProgressDashboard.tsx`:
     - Overall stats card (total completed, percentage)
     - HSK level progress cards (1-6)
     - Completed lessons list
     - Continue learning link (first incomplete lesson)
     - Recent activity (last completed)

7. **Progress Components**
   - `ProgressCard.tsx`:
     - Display overall or HSK-specific stats
     - Progress bar visualization
     - "X of Y lessons completed" text
   - `HskProgressCard.tsx`:
     - HSK level badge
     - Progress bar
     - Click to view HSK detail
   - `ProgressBar.tsx`:
     - Visual percentage bar
     - Color-coded (0-30% red, 31-70% yellow, 71-100% green)
     - Smooth animations

8. **Profile Page**
   - Create `src/pages/profile/ProfilePage.tsx`:
     - User avatar (placeholder or upload)
     - Username, email display
     - Join date
     - Overall progress stats
     - Link to progress dashboard
     - Settings (placeholder for future)

9. **Lesson Completion Integration**
   - Modify `LessonDetailPage.tsx`:
     - Add "Mark as Complete" button
     - Show current completion status
     - Button toggles between Complete/Incomplete
     - Optimistic update for instant feedback
     - Refetch progress on completion

10. **TanStack Query Integration**
    - Query keys for progress data
    - Invalidate progress queries on completion toggle
    - Cache progress for 5 minutes
    - Optimistic updates for completion actions

11. **Navigation Integration**
    - Add progress indicator to HSK cards
    - Add completion badges to lesson cards
    - Show progress percentage in navigation

## Success Criteria

- [ ] User can mark lesson as completed with button
- [ ] Completion persists across page refreshes
- [ ] Progress dashboard shows correct statistics
- [ ] Overall percentage calculated correctly
- [ ] HSK-level progress calculated correctly
- [ ] Completion button reflects current state
- [ ] Progress updates instantly (optimistic UI)
- [ ] Profile page displays user info and stats
- [ ] Navigation shows progress indicators
- [ ] Completed lessons visually distinguished

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition on toggle | Medium | Use unique constraint, handle conflicts |
| Stale progress data | Low | Aggressive cache invalidation |
| Incorrect percentage calc | Low | Test with various completion states |

## Data Structure

**Progress Response:**
```typescript
{
  id: string
  userId: string
  lessonId: string
  isCompleted: boolean
  completedAt: string | null
  lesson: {
    id: string
    title: string
    hskLevel: { level: number, name: string }
  }
}
```

**Stats Response:**
```typescript
{
  totalLessons: number
  completedLessons: number
  percentage: number
  currentHskLevel: { level: number, name: string }
  streak: number // Placeholder for future
}
```

## API Endpoints

```
GET /progress/me
  Headers: { Authorization: "Bearer {accessToken}" }
  Response: [{ id, lessonId, isCompleted, completedAt, lesson }]

GET /progress/stats
  Response: { totalLessons, completedLessons, percentage, currentHskLevel }

GET /progress/hsk/:hskId
  Response: { hskLevel, completed, total, percentage }

POST /progress/complete
  Body: { lessonId }
  Response: { id, isCompleted: true, completedAt }

DELETE /progress/complete/:lessonId
  Response: { id, isCompleted: false, completedAt: null }
```

## UI/UX Considerations

**Completion Button:**
- Disabled when loading
- Shows checkmark icon when completed
- Green background for completed state
- Gray/outline for incomplete state

**Progress Visualization:**
- Donut chart for overall progress
- Linear progress bars for HSK levels
- Color gradients for visual appeal

**Dashboard Layout:**
```
┌─────────────────────────────────────┐
│  Overall Progress: 45%              │
│  ┌─────────┐                        │
│  │  Donut  │  12 of 30 lessons      │
│  └─────────┘                        │
├─────────────────────────────────────┤
│  HSK 1: ████████░░ 80%  [View]     │
│  HSK 2: █████░░░░░░ 50%  [View]     │
│  HSK 3: ██░░░░░░░░░ 20%  [View]     │
├─────────────────────────────────────┤
│  Continue Learning →                │
│  (next incomplete lesson)           │
└─────────────────────────────────────┘
```

## Next Steps

After this phase:
- Core MVP feature complete
- Users can track learning journey
- Ready for Phase 5: Polish and testing

## Notes

- Use optimistic updates for completion toggle
- Invalidate progress cache after completion change
- Consider adding "Undo" for accidental completion
- Progress should sync across devices (server-backed)
- Streak calculation placeholder for future gamification
