---
phase: 2
title: "Authentication Module"
status: completed
priority: P1
effort: "4-5 days"
dependencies: [1]
---

# Phase 2: Authentication Module

<!-- Updated: Validation Session 1 - Changed token storage from localStorage to httpOnly cookies, added CSRF protection -->

## Overview

Implement complete authentication system for the platform including user registration, login, JWT token generation, refresh token handling, and logout. This enables user accounts and session management.

## Requirements

**Functional:**
- User registration with email, username, password (min 8 chars)
- Email uniqueness validation
- Username uniqueness validation
- Password hashing with bcrypt (cost: 12)
- JWT access token generation (15 min expiry)
- Refresh token generation stored in database (7 day expiry)
- Login returns both tokens
- Refresh endpoint to get new access token
- Logout revokes refresh token
- Protected route guard for authenticated endpoints

**Non-functional:**
- Password comparison timing-safe
- JWT signed with secure secret from env
- Refresh tokens stored securely in database
- API rate limiting on auth endpoints
- CSRF protection for cookie-based auth
- httpOnly cookies prevent XSS token theft

## Architecture

**Backend Modules:**
```
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── refresh-jwt.guard.ts
├── decorators/
│   └── current-user.decorator.ts
└── dto/
    ├── register.dto.ts
    ├── login.dto.ts
    └── auth-response.dto.ts
```

**Frontend Pages:**
```
src/pages/auth/
├── LoginPage.tsx
└── RegisterPage.tsx

src/stores/
└── auth-store.ts (Zustand - minimal state, cookies handle tokens)
```

## Related Code Files

**Create (Backend):**
```
backend/src/auth/auth.module.ts
backend/src/auth/auth.controller.ts
backend/src/auth/auth.service.ts
backend/src/auth/strategies/jwt.strategy.ts
backend/src/auth/guards/jwt-auth.guard.ts
backend/src/auth/guards/refresh-jwt.guard.ts
backend/src/auth/decorators/current-user.decorator.ts
backend/src/auth/dto/register.dto.ts
backend/src/auth/dto/login.dto.ts
backend/src/auth/dto/auth-response.dto.ts
backend/src/users/users.module.ts
backend/src/users/users.service.ts
backend/src/users/users.controller.ts
backend/prisma/schema.prisma (users, refresh_tokens tables)
```

**Create (Frontend):**
```
frontend/src/pages/auth/LoginPage.tsx
frontend/src/pages/auth/RegisterPage.tsx
frontend/src/stores/auth-store.ts
frontend/src/api/auth-api.ts
frontend/src/components/ui/Button.tsx
frontend/src/components/ui/Input.tsx
frontend/src/components/ui/Card.tsx
frontend/src/components/ui/Label.tsx
```

**Modify:**
```
backend/src/app.module.ts (import AuthModule, UsersModule)
frontend/src/main.tsx (TanStackQueryProvider setup)
frontend/src/App.tsx (routes for /login, /register)
```

## Implementation Steps

### Backend (3 days)

1. **Prisma Schema for Auth**
   - Define `User` model:
     ```prisma
     model User {
       id            String    @id @default(cuid())
       email         String    @unique
       username      String    @unique
       passwordHash  String
       avatar        String?
       createdAt     DateTime  @default(now())
       updatedAt     DateTime  @updatedAt
       deletedAt     DateTime?
       refreshTokens RefreshToken[]
     }
     ```
   - Define `RefreshToken` model:
     ```prisma
     model RefreshToken {
       id        String   @id @default(cuid())
       token     String   @unique
       userId    String
       expiresAt DateTime
       createdAt DateTime @default(now())
       user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     }
     ```
   - Run migration: `npx prisma migrate dev --name init_auth_tables`

2. **Auth Module - Service**
   - Create `auth.service.ts`:
     - `register()` - Validate unique email/username, hash password with bcrypt, create user
     - `login()` - Verify password, generate JWT + refresh token
     - `refreshTokens()` - Verify refresh token, generate new access token
     - `logout()` - Delete refresh token from database
   - Install: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`

3. **JWT Strategy**
   - Create `jwt.strategy.ts`:
     - Extract and validate JWT from Authorization header
     - Return user payload for guards
   - Configure JWT_SECRET and JWT_EXPIRES_IN from env

4. **Guards**
   - `jwt-auth.guard.ts` - Protect routes requiring authentication
   - `refresh-jwt.guard.ts` - Separate guard for refresh endpoint

5. **Auth Controller**
   - POST `/auth/register` - RegisterDto → User (without password)
   - POST `/auth/login` - LoginDto → { accessToken, refreshToken, user }
   - POST `/auth/refresh` - Refresh token → { accessToken }
   - POST `/auth/logout` - Requires auth guard, revokes token

6. **Users Module**
   - Create `users.service.ts` with findById, findByEmail, findByUsername
   - Create `users.controller.ts`:
     - GET `/users/me` - Return current user profile
     - PATCH `/users/me` - Update profile (avatar, username)
   - Create `current-user.decorator` for extracting user from JWT

7. **DTOs with Validation**
   - `register.dto.ts`:
     ```typescript
     @IsEmail() email: string
     @MinLength(3) @MaxLength(20) username: string
     @MinLength(8) password: string
     ```
   - `login.dto.ts`: email, password
   - Use class-validator decorators

### Frontend (2 days)

8. **Auth API Client**
   - Create `src/api/auth-api.ts`:
     - `register(data)` → POST /auth/register
     - `login(data)` → POST /auth/login
     - `refreshToken(token)` → POST /auth/refresh
     - `logout()` → POST /auth/logout

9. **Auth Store (Zustand)**
   - Create `src/stores/auth-store.ts`:
     ```typescript
     interface AuthState {
       user: User | null
       isAuthenticated: boolean
       login: (email, password) => Promise<void>
       register: (email, username, password) => Promise<void>
       logout: () => void
     }
     ```
   - **Note:** Tokens stored in httpOnly cookies (backend-managed)
   - Store only user state and authentication status
   - Auto-refresh handled by cookie-based auth flow

10. **Login Page**
    - Create `src/pages/auth/LoginPage.tsx`:
      - Email input, Password input
      - Submit button calls authStore.login()
      - Error display for failed login
      - Link to register page

11. **Register Page**
    - Create `src/pages/auth/RegisterPage.tsx`:
      - Email, Username, Password (min 8), Confirm Password inputs
      - Validation feedback
      - Submit button calls authStore.register()
      - Redirect to login on success

12. **Route Protection**
    - Create ProtectedRoute component
    - Redirect to /login if not authenticated
    - Store original location for redirect after login

13. **TanStack Query Integration**
    - Wrap app with QueryClientProvider
    - Configure queryClient for auth integration
    - Auto-retry on 401 with refresh token

## Success Criteria

- [ ] User can register with valid email, username, password
- [ ] Duplicate email/username returns 400 error
- [ ] User can login with correct credentials
- [ ] Login returns access token (15min expiry) and refresh token (7day expiry)
- [ ] Access token works for protected endpoints
- [ ] Expired access token rejected with 401
- [ ] Refresh token generates new access token
- [ ] Logout deletes refresh token from DB
- [ ] Frontend stores tokens securely via httpOnly cookies
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Passwords hashed with bcrypt before storage
- [ ] CSRF protection enabled on cookie endpoints

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Weak JWT secret | Critical | Use strong env variable, document generation |
| Password timing attack | High | Use bcrypt (timing-safe by design) |
| CSRF attack on cookies | High | Implement CSRF protection (SameSite, CSRF tokens) |
| Refresh token reuse | Medium | Single-use tokens, rotate on refresh |
| Rate limit bypass | Low | Implement @Throttler() decorator |

## Security Considerations

- **Password hashing:** bcrypt with cost factor 12 (adjustable)
- **JWT secret:** Minimum 32 bytes, use crypto.randomBytes()
- **Token storage:** httpOnly cookies (access + refresh tokens) - Updated from localStorage per validation
- **CSRF protection:** SameSite=strict cookie attribute + CSRF tokens for state-changing requests
- **Rate limiting:** 5 requests per minute on auth endpoints
- **Input validation:** Strict DTOs with class-validator
- **CORS:** Whitelist frontend origin only

**Cookie Configuration:**
- httpOnly: true (prevents JavaScript access)
- secure: true (HTTPS only in production)
- sameSite: strict (prevents CSRF)
- path: /
- maxAge: matches token expiry

## API Endpoints

```
POST /auth/register
  Body: { email, username, password }
  Response: { id, email, username, createdAt }

POST /auth/login
  Body: { email, password }
  Response: { accessToken, refreshToken, user: { id, email, username } }

POST /auth/refresh
  Headers: { Authorization: "Bearer {refreshToken}" }
  Response: { accessToken }

POST /auth/logout
  Headers: { Authorization: "Bearer {accessToken}" }
  Response: { message: "Logged out" }

GET /users/me
  Headers: { Authorization: "Bearer {accessToken}" }
  Response: { id, email, username, avatar, createdAt }

PATCH /users/me
  Headers: { Authorization: "Bearer {accessToken}" }
  Body: { username?, avatar? }
  Response: { id, email, username, avatar, updatedAt }
```

## Next Steps

After this phase:
- Authenticated users can access protected content
- Ready for Phase 3: Content structure (HSK + Lessons)
- User ID available for progress tracking

## Notes

- Use `passport-jwt` for standard JWT extraction
- Refresh tokens should be rotated (delete old, create new)
- Consider adding device fingerprinting for security
- Frontend should handle 401 by attempting token refresh
