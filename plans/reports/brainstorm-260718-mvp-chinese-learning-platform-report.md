# Chinese Learning Platform - MVP Architecture Proposal

**Date:** 2026-07-18
**Type:** Architecture Brainstorm
**Scope:** MVP (Auth + Learning Basic)

---

## User Requirements Summary

| Decision | Choice |
|----------|--------|
| Repository Structure | Monorepo (1 repo) |
| Authentication | JWT + Refresh Token (DB stored) |
| Database Schema | MVP min (5 tables) |
| Infrastructure | Docker Compose local dev |
| Plan Style | Plan only (no code) |

---

## 1. Proposed Architecture

### 1.1 Repository Structure

```
chinese-learning/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # Users module
│   │   ├── hsk/          # HSK levels module
│   │   ├── lessons/      # Lessons module
│   │   ├── vocabulary/   # Vocabulary module
│   │   ├── progress/     # User progress module
│   │   ├── common/       # Shared utilities
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   └── package.json
│
├── frontend/             # Vite + React
│   ├── src/
│   │   ├── pages/        # Route pages
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── api/          # API clients
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
├── docker/
│   ├── dev.docker-compose.yml
│   └── prod.docker-compose.yml
│
└── README.md
```

### 1.2 Technology Stack Confirmation

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI framework |
| | Vite | Build tool |
| | React Router v7 | Routing |
| | TanStack Query | Server state |
| | Zustand | Client state |
| | TailwindCSS | Styling |
| | shadcn/ui | Component library |
| Backend | NestJS | API framework |
| | Prisma | ORM |
| | PostgreSQL | Database |
| | JWT + bcrypt | Security |
| Infrastructure | Docker Compose | Local dev |
| | Nginx | Reverse proxy |

---

## 2. Database Schema (MVP - 5 Tables)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === Core Tables ===

model User {
  id            String    @id @default(cuid)
  email         String    @unique
  username      String    @unique
  passwordHash  String
  avatar        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete

  refreshTokens RefreshToken[]
  progress      UserProgress[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid)
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

model HskLevel {
  id        String    @id @default(cuid)
  level     Int       @unique // 1-6
  name      String    // "HSK 1", "HSK 2", etc.
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  lessons Lesson[]

  @@map("hsk_levels")
}

model Lesson {
  id         String   @id @default(cuid)
  hskLevelId String
  title      String
  description String?
  order      Int      // Lesson order within HSK level
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  hskLevel   HskLevel @relation(fields: [hskLevelId], references: [id])
  vocabularies Vocabulary[]
  progress   UserProgress[]

  @@unique([hskLevelId, order])
  @@index([hskLevelId])
  @@map("lessons")
}

model Vocabulary {
  id          String   @id @default(cuid)
  lessonId    String
  hanzi       String   // Chinese character
  pinyin      String   // Pronunciation
  meaning     String   // Vietnamese meaning
  audioUrl    String?  // Optional audio
  example     String?  // Example sentence
  wordType    String?  // noun, verb, etc.
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lesson      Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([lessonId])
  @@map("vocabularies")
}

model UserProgress {
  id          String   @id @default(cuid)
  userId      String
  lessonId    String
  isCompleted Boolean  @default(false)
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
  @@map("user_progress")
}
```

### Schema Rationale

- **Soft delete** on `User.deletedAt` for GDPR/audit
- **Cascade delete** for child data when parent deleted
- **Unique constraints** on `userId + lessonId` for progress (one entry per lesson per user)
- **Indexes** on foreign keys for query performance
- **CUID** for IDs (distributed-friendly, URL-safe)

---

## 3. Backend API Design (NestJS Modules)

### 3.1 Module Structure

```
src/
├── main.ts                    # Entry point
├── app.module.ts              # Root module
│
├── common/                    # Shared code
│   ├── filters/               # Exception filters
│   ├── guards/                # Auth guards
│   ├── interceptors/          # Logging, transform
│   ├── pipes/                 # Validation
│   └── decorators/            # Custom decorators
│
├── auth/                      # Authentication
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/            # JWT strategy
│   └── dto/                   # Request/Response DTOs
│
├── users/                     # Users
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│
├── hsk/                       # HSK Levels
│   ├── hsk.module.ts
│   ├── hsk.controller.ts
│   ├── hsk.service.ts
│   └── dto/
│
├── lessons/                   # Lessons
│   ├── lessons.module.ts
│   ├── lessons.controller.ts
│   ├── lessons.service.ts
│   └── dto/
│
├── vocabulary/               # Vocabulary
│   ├── vocabulary.module.ts
│   ├── vocabulary.controller.ts
│   ├── vocabulary.service.ts
│   └── dto/
│
└── progress/                 # User Progress
    ├── progress.module.ts
    ├── progress.controller.ts
    ├── progress.service.ts
    └── dto/
```

### 3.2 MVP API Endpoints

**Auth:**
```
POST   /auth/register         # Register new user
POST   /auth/login            # Login (returns tokens)
POST   /auth/refresh          # Refresh access token
POST   /auth/logout           # Logout (revoke refresh token)
```

**Users:**
```
GET    /users/me              # Current user profile
PATCH  /users/me              # Update profile
```

**HSK:**
```
GET    /hsk                   # List all HSK levels
GET    /hsk/:id               # Get HSK level with lessons
```

**Lessons:**
```
GET    /lessons               # List lessons (with pagination)
GET    /lessons/:id           # Get lesson detail
```

**Vocabulary:**
```
GET    /lessons/:id/vocabulary     # Get vocabularies for lesson
GET    /vocabulary/search?q={term} # Search by hanzi/pinyin/meaning
```

**Progress:**
```
GET    /progress/me           # Get user's progress
POST   /progress/complete     # Mark lesson as completed
```

### 3.3 Security Layers

| Layer | Implementation |
|-------|----------------|
| Password | bcrypt (cost: 12) |
| Access Token | JWT (15 min expiry) |
| Refresh Token | Random token in DB (7 day expiry) |
| API Protection | JwtAuthGuard |
| Rate Limiting | @Throttler() decorator |
| Validation | class-validator DTOs |
| CORS | Configured for frontend origin |
| Helmet | Security headers |

---

## 4. Frontend Architecture

### 4.1 State Management Strategy

| State Type | Solution | Rationale |
|------------|----------|-----------|
| Server State | TanStack Query | Cache, refetch, loading states |
| Client State | Zustand | Simple, no boilerplate |
| URL State | React Router | Search params for filters |
| Form State | React Hook Form | Performance, validation |

### 4.2 Page Structure (MVP)

```
src/pages/
├── auth/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
│
├── hsk/
│   ├── HskListPage.tsx        # List HSK levels
│   └── HskDetailPage.tsx      # HSK with lessons
│
├── lessons/
│   ├── LessonListPage.tsx     # Lessons in HSK
│   └── LessonDetailPage.tsx   # Lesson content + vocab
│
├── progress/
│   └── ProgressPage.tsx       # User progress dashboard
│
└── profile/
    └── ProfilePage.tsx        # User profile
```

### 4.3 API Client Structure

```typescript
src/api/
├── client.ts                  # Axios/Fetch base client
├── auth-api.ts               # Auth endpoints
├── hsk-api.ts                # HSK endpoints
├── lessons-api.ts            # Lesson endpoints
├── vocabulary-api.ts         # Vocabulary endpoints
└── progress-api.ts           # Progress endpoints
```

### 4.4 TanStack Query Keys Convention

```typescript
// keys.ts
export const queryKeys = {
  auth: ['auth'] as const,
  users: {
    me: (id: string) => ['users', id] as const,
  },
  hsk: {
    all: ['hsk'] as const,
    detail: (id: string) => ['hsk', id] as const,
  },
  lessons: {
    all: ['lessons'] as const,
    detail: (id: string) => ['lessons', id] as const,
  },
  vocabulary: {
    byLesson: (lessonId: string) => ['vocabulary', lessonId] as const,
    search: (q: string) => ['vocabulary', 'search', q] as const,
  },
  progress: {
    me: ['progress', 'me'] as const,
  },
} as const;
```

---

## 5. Docker Development Environment

### 5.1 docker-compose.dev.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: chinese_learning_db
    environment:
      POSTGRES_USER: chinese_dev
      POSTGRES_PASSWORD: chinese_dev_password
      POSTGRES_DB: chinese_learning_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: chinese_learning_api
    environment:
      DATABASE_URL: postgresql://chinese_dev:chinese_dev_password@postgres:5432/chinese_learning_dev
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 15m
      REFRESH_TOKEN_EXPIRES_IN: 7d
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: chinese_learning_web
    environment:
      VITE_API_URL: http://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 5.2 Development Workflow

```bash
# Start all services
docker-compose -f docker/docker-compose.dev.yml up

# Run Prisma migrations
docker-compose -f docker/docker-compose.dev.yml exec backend npx prisma migrate dev

# Seed database
docker-compose -f docker/docker-compose.dev.yml exec backend npx prisma db seed

# Access backend shell
docker-compose -f docker/docker-compose.dev.yml exec backend sh

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f backend
```

---

## 6. MVP Feature Scope

### Phase 1: Foundation (Docker + DB + Auth)
- [ ] Docker Compose setup
- [ ] PostgreSQL database
- [ ] Prisma schema (5 tables)
- [ ] Backend: Auth module
- [ ] Frontend: Auth pages (Login, Register)
- [ ] JWT middleware

### Phase 2: Content Structure (HSK + Lessons)
- [ ] Backend: HSK module
- [ ] Backend: Lessons module
- [ ] Backend: Vocabulary module
- [ ] Frontend: HSK list/detail pages
- [ ] Frontend: Lesson detail page
- [ ] Vocabulary display with audio (optional)

### Phase 3: Progress Tracking
- [ ] Backend: Progress module
- [ ] Frontend: Progress dashboard
- [ ] Mark lesson as completed
- [ ] User profile page

**Out of Scope for MVP:**
- Quizzes/Questions
- Grammar points
- Wrong answer review
- Admin panel
- Search functionality
- History tracking

---

## 7. Implementation Phases

### Phase 1: Infrastructure & Auth (Week 1)
**Goal:** Working Docker environment + user can register/login

1. **Infrastructure Setup**
   - Docker Compose configuration
   - PostgreSQL container
   - Network setup

2. **Backend Foundation**
   - NestJS project structure
   - Prisma setup & schema
   - Common utilities (guards, filters, decorators)

3. **Auth Module**
   - Register endpoint
   - Login endpoint (JWT + Refresh token)
   - Refresh token endpoint
   - Logout endpoint

4. **Frontend Auth**
   - Login page
   - Register page
   - Token storage (localStorage/secure storage)
   - Auth context/store

### Phase 2: Content - HSK & Lessons (Week 2)
**Goal:** User can browse HSK levels and view lessons

1. **Backend Content**
   - HSK CRUD module
   - Lessons CRUD module
   - Vocabulary CRUD module
   - Seed data (HSK 1-2 sample content)

2. **Frontend Content**
   - HSK list page
   - HSK detail page (shows lessons)
   - Lesson detail page (shows vocabulary)
   - Vocabulary card component

### Phase 3: Progress Tracking (Week 3)
**Goal:** User can track learning progress

1. **Backend Progress**
   - Progress CRUD module
   - Mark complete endpoint
   - Get progress endpoint

2. **Frontend Progress**
   - Progress dashboard
   - Completion toggle
   - Progress visualization
   - User profile page

### Phase 4: Polish & Deploy (Week 4)
**Goal:** Production-ready MVP

1. **Testing**
   - Unit tests (critical paths)
   - E2E tests (auth flow)

2. **Security Audit**
   - Check JWT implementation
   - Validate input sanitization
   - Review CORS configuration

3. **Production Setup**
   - Production Docker Compose
   - Nginx configuration
   - Environment variables
   - Deployment guide

---

## 8. Technical Decisions Summary

| Area | Decision | Rationale |
|------|----------|-----------|
| **Repo Structure** | Monorepo | Single project, easier coordination |
| **State Management** | TanStack Query + Zustand | Best of both: server + client state |
| **Auth Tokens** | JWT (15min) + Refresh (7d, DB) | Industry standard, secure |
| **Password Hashing** | bcrypt (cost 12) | Secure, widely adopted |
| **ORM** | Prisma | Type-safe, great DX |
| **API Style** | REST | Simple, fits requirements |
| **Validation** | class-validator | NestJS standard |
| **Routing** | React Router v7 | Latest, stable |
| **Styling** | TailwindCSS + shadcn/ui | Fast, consistent |
| **Docker** | Compose for dev | Simple local setup |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Token leakage** | httpOnly cookies for refresh, short-lived access tokens |
| **DB performance** | Indexes on foreign keys, pagination |
| ** CORS issues** | Proper config in dev + prod |
| **Docker complexity** | Detailed setup guide, simplified compose file |
| **Scope creep** | Strict MVP boundaries, defer features |

---

## 10. Next Steps

1. **Review this proposal** - Confirm/agree with architectural decisions
2. **Create detailed plan** - Use `/ck:plan` to create phase-by-phase implementation plan
3. **Start implementation** - Begin with Phase 1 (Infrastructure & Auth)

---

## Unresolved Questions

- Should I add Redis for caching? (Not needed for MVP, defer)
- Admin authentication - same flow or separate role? (Same flow + role check)
- Audio hosting - where to store vocabulary audio files? (Defer to later)
- Seed data strategy - manual SQL or Prisma seed script? (Prisma seed)

---

**Report Type:** Brainstorm Architecture Proposal
**Status:** Ready for user review and planning phase
