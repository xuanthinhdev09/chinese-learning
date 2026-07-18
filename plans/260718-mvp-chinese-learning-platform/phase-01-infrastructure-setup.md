---
phase: 1
title: "Infrastructure Setup"
status: completed
priority: P1
effort: "3-4 days"
completedAt: "2026-07-18"
dependencies: []
---

# Phase 1: Infrastructure Setup

## Overview

Establish development environment with Docker Compose, PostgreSQL database, NestJS backend structure, and Vite + React frontend structure. This phase provides the foundation for all subsequent development.

## Requirements

**Functional:**
- Docker Compose configuration for local development
- PostgreSQL 16 container with persistent volume
- NestJS backend project structure
- Vite + React + TypeScript frontend project structure
- Prisma ORM configured with PostgreSQL connection
- Development hot-reload for all services

**Non-functional:**
- < 2 minutes to spin up full environment
- Hot reload on code changes
- Volume persistence for database
- Network isolation between services

## Architecture

```
docker-compose.dev.yml
├── postgres (port 5432)
│   └── Volume: postgres_data
├── backend (port 3000)
│   ├── Depends on: postgres
│   └── Volume mount: ./backend → /app
└── frontend (port 5173)
    └── Depends on: backend
```

**Network:** All services on `chinese_learning_network` (isolated)

## Related Code Files

**Create:**
```
docker/docker-compose.dev.yml
docker/.env.example
backend/package.json
backend/tsconfig.json
backend/nest-cli.json
backend/src/main.ts
backend/src/app.module.ts
backend/prisma/schema.prisma
frontend/package.json
frontend/tsconfig.json
frontend/vite.config.ts
frontend/index.html
frontend/src/main.tsx
frontend/src/App.tsx
README.md (with Docker instructions)
```

## Implementation Steps

1. **Create Monorepo Structure**
   - Create `backend/` and `frontend/` directories
   - Create `docker/` directory for compose files
   - Initialize git with proper `.gitignore`

2. **Docker Compose Configuration**
   - Create `docker/docker-compose.dev.yml`
   - Configure PostgreSQL service with:
     - Image: `postgres:16-alpine`
     - Environment: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
     - Volume: `postgres_data:/var/lib/postgresql/data`
     - Port: `5432:5432`
   - Configure backend service (NestJS):
     - Build context: `./backend`
     - Port: `3000:3000`
     - Depends on: postgres
     - Environment: `DATABASE_URL`, `JWT_SECRET`, etc.
   - Configure frontend service (Vite):
     - Build context: `./frontend`
     - Port: `5173:5173`
     - Depends on: backend

3. **Backend Setup**
   - Initialize NestJS project: `npm init` + install dependencies
   - Install: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@prisma/client`, `prisma`
   - Create `src/main.ts` with NestFactory bootstrap
   - Create `src/app.module.ts` root module
   - Configure `tsconfig.json` and `nest-cli.json`

4. **Frontend Setup**
   - Initialize Vite project: `npm create vite@latest frontend -- --template react-ts`
   - Install: `@tanstack/react-query`, `zustand`, `react-router-dom`, `tailwindcss`, `@shadcn/ui`
   - Configure TailwindCSS: `tailwind.config.js`
   - Configure Vite proxy for API calls

5. **Prisma Configuration**
   - Install Prisma CLI: `npm install -D prisma`
   - Initialize: `npx prisma init`
   - Configure schema (placeholder for MVP tables)
   - Set DATABASE_URL in Docker environment

6. **Environment Variables**
   - Create `docker/.env.example`:
     ```
     DATABASE_URL=postgresql://user:pass@postgres:5432/db
     JWT_SECRET=your-secret-key
     JWT_EXPIRES_IN=15m
     REFRESH_TOKEN_EXPIRES_IN=7d
     PORT=3000
     VITE_API_URL=http://localhost:3000
     ```

7. **Documentation**
   - Update README.md with:
     - Prerequisites (Docker Desktop)
     - Quick start commands
     - Service URLs
     - Development workflow

## Success Criteria

- [ ] `docker-compose -f docker/docker-compose.dev.yml up` starts all services without errors
- [ ] PostgreSQL accepts connections on port 5432
- [ ] Backend responds on http://localhost:3000
- [ ] Frontend loads on http://localhost:5173
- [ ] Code changes in backend trigger hot reload
- [ ] Code changes in frontend trigger Vite HMR
- [ ] Database persists data across container restarts
- [ ] README.md instructions work for fresh clone

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docker not installed | Blocker | Document prerequisite, provide fallback local setup |
| Port conflicts | Medium | Use configurable ports in env file |
| Volume permission issues | Medium | Use named volumes, document permissions |
| Network isolation issues | Low | Default Docker networking is reliable |

## Next Steps

After this phase, the development environment is ready for:
- Phase 2: Implement authentication module
- Prisma migrations for user tables
- API development with hot reload

## Notes

- Use `postgres:16-alpine` for smaller image size
- Configure `restart: unless-stopped` for development convenience
- Backend Dockerfile should use multi-stage build for production later
- Frontend uses Vite's dev server in development mode
