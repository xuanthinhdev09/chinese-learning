---
phase: 5
title: "Polish & Deploy"
status: pending
priority: P2
effort: "3-4 days"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Polish & Deploy

## Overview

Finalize MVP with testing, security review, production Docker configuration, and deployment documentation. This phase ensures the platform is production-ready and properly documented.

## Requirements

**Functional:**
- All critical flows have E2E test coverage
- Security audit passed
- Production Docker configuration
- Environment variable management
- Deployment documentation
- Error handling and logging

**Non-functional:**
- No critical bugs
- API response times under 300ms
- Security headers configured
- Proper error messages
- Clean git history

## Architecture

**Testing:**
```
backend/test/
├── unit/
│   ├── auth.service.spec.ts
│   └── progress.service.spec.ts
└── e2e/
    └── auth-flow.e2e-spec.ts

frontend/test/
├── components/
│   └── VocabularyCard.test.tsx
└── e2e/
    └── login-flow.spec.ts
```

**Production:**
```
docker/
├── docker-compose.prod.yml
├── nginx.conf
└── .env.production
```

## Related Code Files

**Create:**
```
backend/test/unit/auth.service.spec.ts
backend/test/e2e/auth-flow.e2e-spec.ts
frontend/test/components/VocabularyCard.test.tsx
frontend/test/e2e/login-flow.spec.ts
docker/docker-compose.prod.yml
docker/nginx.conf
DEPLOYMENT.md
docker/.env.production
```

**Modify:**
```
backend/src/main.ts (CORS, helmet, logging)
backend/Dockerfile (production build)
frontend/Dockerfile (production build)
README.md (add deployment section)
package.json (add test scripts)
```

## Implementation Steps

### Testing (2 days)

1. **Backend Unit Tests**
   - Install: `@nestjs/testing`, `jest`, `supertest`
   - Create `auth.service.spec.ts`:
     - Test register with valid data
     - Test register fails on duplicate email
     - Test login with correct credentials
     - Test login fails on wrong password
     - Test password hashing
   - Create `progress.service.spec.ts`:
     - Test toggle completion
     - Test stats calculation
     - Test unique constraint on progress

2. **Backend E2E Tests**
   - Create `auth-flow.e2e-spec.ts`:
     - Register new user
     - Login with credentials
     - Access protected endpoint
     - Refresh token flow
     - Logout revokes token
   - Configure Jest for NestJS E2E

3. **Frontend Component Tests**
   - Install: `vitest`, `@testing-library/react`, `@testing-library/user-event`
   - Create `VocabularyCard.test.tsx`:
     - Render hanzi, pinyin, meaning
     - Test audio button (if present)
   - Create `LoginPage.test.tsx`:
     - Form validation
     - Submit with valid data
     - Error display

4. **Frontend E2E Tests**
   - Install: `@playwright/test`
   - Create `login-flow.spec.ts`:
     - Navigate to login
     - Fill email/password
     - Submit form
     - Verify redirect to dashboard
     - Verify token storage

5. **Test Scripts**
   - Update package.json scripts:
     ```json
     "test": "jest",
     "test:e2e": "jest --config ./test/jest-e2e.json",
     "test:watch": "jest --watch",
     "test:frontend": "vitest",
     "test:e2e:frontend": "playwright test"
     ```

### Security Review (1 day)

6. **Security Checklist**
   - [ ] JWT secret is strong (32+ bytes)
   - [ ] Passwords hashed with bcrypt (cost 12+)
   - [ ] SQL injection prevented (Prisma handles)
   - [ ] XSS prevention (React handles, validate inputs)
   - [ ] CORS configured for specific origins
   - [ ] Rate limiting on auth endpoints
   - [ ] Helmet security headers enabled
   - [ ] Input validation on all DTOs
   - [ ] Sensitive data not logged
   - [ ] Refresh tokens are single-use

7. **Security Configuration**
   - Install: `@nestjs/throttler`, `helmet`
   - Configure throttler:
     ```typescript
     ThrottlerModule.forRoot({
       ttl: 60000,
       limit: 5,
     })
     ```
   - Enable Helmet in main.ts
   - Configure CORS whitelist
   - Add rate limiting to auth endpoints

8. **Environment Variables**
   - Create `docker/.env.production` template:
     ```
     DATABASE_URL=postgresql://user:pass@postgres:5432/db
     JWT_SECRET=<generate with openssl rand -base64 32>
     JWT_EXPIRES_IN=15m
     REFRESH_TOKEN_EXPIRES_IN=7d
     NODE_ENV=production
     CORS_ORIGIN=https://yourdomain.com
     ```
   - Document each variable in DEPLOYMENT.md

### Production Configuration (1 day)

9. **Production Docker Compose**
   - Create `docker-compose.prod.yml`:
     - Use production images (not dev)
     - Separate PostgreSQL configuration
     - Nginx reverse proxy
     - No volume mounts for code
     - Proper restart policies
   - Configure Nginx:
     - Reverse proxy for API
     - Static file serving for frontend
     - SSL configuration (Let's Encrypt placeholder)

10. **Production Dockerfiles**
    - Backend `Dockerfile.prod`:
      - Multi-stage build
      - Run migrations on startup
      - Non-root user
      - Health check endpoint
    - Frontend `Dockerfile.prod`:
      - Build step
      - Serve with nginx
      - Optimized build (minification)

11. **Logging**
    - Configure NestJS logging:
      - Use winston or nest logger
      - Log levels for production
      - Request logging middleware
    - Add structured logging for:
      - User actions (login, logout)
      - Errors with stack traces
      - API requests (optional)

### Documentation (1 day)

12. **Deployment Guide**
    - Create `DEPLOYMENT.md`:
      - Prerequisites
      - Environment setup
      - Docker compose commands
      - Database migrations
      - Seed data
      - Verification steps
      - Troubleshooting

13. **API Documentation**
    - Configure Swagger in NestJS:
      - Auto-generate from DTOs
      - Add descriptions to endpoints
      - Document auth requirements
      - Access at /api/docs

14. **Update README**
    - Add sections:
      - Quick start (local dev)
      - Development workflow
      - Testing guide
      - Deployment link
      - Troubleshooting

15. **Git Cleanup**
    - Review commit history
    - Ensure clean main branch
    - Tag release version (v0.1.0-mvp)

## Success Criteria

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Security checklist complete
- [ ] Production docker-compose runs without errors
- [ ] Nginx serves frontend and proxies API
- [ ] JWT secret is strong and documented
- [ ] Rate limiting prevents brute force
- [ ] CORS configured for production domain
- [ ] API documentation accessible at /api/docs
- [ ] Deployment guide is clear and complete
- [ ] No critical console errors in production

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Weak JWT secret in production | Critical | Generate with crypto, document rotation |
| Missing rate limiting | High | Add throttler to all auth endpoints |
| CORS misconfiguration | Medium | Test with production domain |
| Database migration failure | Medium | Backup before migrate, test on staging |
| Nginx misconfiguration | Medium | Test reverse proxy locally |

## Pre-Deployment Checklist

**Environment:**
- [ ] Generate strong JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN
- [ ] Set secure DATABASE_URL
- [ ] Review all environment variables

**Database:**
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Run seed data (if needed)
- [ ] Backup database
- [ ] Test connection

**Application:**
- [ ] Build frontend: `npm run build`
- [ ] Build backend: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Run E2E: `npm run test:e2e`

**Deployment:**
- [ ] Tag release: `git tag v0.1.0-mvp`
- [ ] Push to production
- [ ] Pull latest images
- [ ] Restart services
- [ ] Verify health endpoints

## Production Docker Compose Structure

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    image: chinese-learning-api:prod
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
    restart: always

  frontend:
    image: chinese-learning-web:prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - frontend
    restart: always

volumes:
  postgres_data:
```

## Next Steps

After this phase:
- MVP is production-ready
- Can be deployed to production server
- Ready for user testing and feedback
- Foundation for Phase 2 features (Quizzes, Admin, etc.)

## Notes

- Start with staging deployment first
- Monitor logs and performance in production
- Have rollback plan ready
- Document any production issues
- Collect user feedback for next iteration

## Out of Scope (Future)

- CI/CD pipeline setup
- Automated backups
- Monitoring and alerting
- SSL certificate automation
- Load balancing
- CDN setup
