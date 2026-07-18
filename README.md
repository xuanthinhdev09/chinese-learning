# Chinese Learning Platform

MVP cho nền tảng học tiếng Trung HSK 1-6 với Authentication, Content Structure, và Progress Tracking.

## Tech Stack

- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Infrastructure:** Docker Compose
- **Auth:** JWT (httpOnly cookies) + CSRF Protection

## Prerequisites

- Docker Desktop
- Node.js 18+ (for local development fallback)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd chinese-learning
```

### 2. Configure Environment
```bash
cp docker/.env.example docker/.env
# Edit docker/.env if needed
```

### 3. Start Services
```bash
docker-compose -f docker/docker-compose.dev.yml up
```

### 4. Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5432

## Development Workflow

### Backend (NestJS)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name <migration-name>
npx prisma studio
```

## Project Structure

```
chinese-learning/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── users/       # Users module
│   │   ├── prisma/      # Prisma service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── stores/      # Zustand stores
│   │   ├── components/  # UI components
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── docker/              # Docker configurations
│   ├── docker-compose.dev.yml
│   └── .env.example
└── plans/              # Implementation plans
```

## API Endpoints (Planned)

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and revoke token

### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update profile

### Content (Phase 3)
- `GET /hsk-levels` - Get all HSK levels
- `GET /hsk-levels/:id/lessons` - Get lessons by HSK level
- `GET /lessons/:id` - Get lesson details
- `GET /lessons/:id/vocabularies` - Get vocabulary by lesson

### Progress (Phase 4)
- `GET /user-progress` - Get user progress
- `POST /user-progress/:lessonId` - Mark lesson complete
- `GET /user-progress/stats` - Get learning statistics

## Current Status

- [x] Phase 1: Infrastructure Setup ✅ COMPLETED
- [x] Phase 2: Authentication Module ✅ COMPLETED
- [ ] Phase 3: Content Structure (HSK + Lessons)
- [ ] Phase 4: Progress Tracking
- [ ] Phase 5: Polish & Deploy

## License

MIT
