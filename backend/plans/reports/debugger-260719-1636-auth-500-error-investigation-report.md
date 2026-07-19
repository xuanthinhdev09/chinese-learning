# 500 Error Investigation Report - Authentication Endpoints

**Date:** 2026-07-19  
**Issue:** POST /auth/login and POST /auth/register return 500 Internal Server Error  
**Status:** ROOT CAUSE IDENTIFIED  

## Executive Summary

**Root Cause:** PostgreSQL database server is not running on localhost:5432  
**Impact:** All authentication endpoints fail with 500 errors  
**Severity:** HIGH - Application completely non-functional  

## Evidence Chain

### 1. Symptom Analysis
- **Validation works:** Short password returns 400 (validation occurs before DB)
- **Both endpoints fail:** `/auth/login` and `/auth/register` return 500
- **No stack traces visible:** Initial testing showed generic 500 errors

### 2. Code Review ✅ PASSED
- `auth.service.ts` - Logic correct (bcrypt hashing, JWT generation, Prisma calls)
- `auth.controller.ts` - Routes properly configured
- `auth.module.ts` - Dependencies correctly injected
- Prisma schema - Models properly defined with relations
- DTO files - Validation decorators correctly applied

### 3. Prisma Client ✅ PASSED
- Generated successfully: `node_modules/.prisma/client` exists
- Schema sync worked: `prisma db pull` succeeded (when DB was temporarily accessible)
- No schema mismatch errors

### 4. Database Connection ❌ FAILED

**Critical Evidence:**
```
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
Please make sure your database server is running at `localhost:5432`.
Error Code: P1001
```

**Port Verification:**
```bash
netstat -ano | findstr :5432
# No results - PostgreSQL not running
```

**Service Verification:**
```bash
sc query postgresql-x64-16
# [SC] OpenService FAILED 1060 - Service not installed
```

**Prisma CLI Test:**
```bash
npx prisma db push
# Error: P1001: Can't reach database server at `localhost:5432`
```

## Hypotheses Tested

### Hypothesis 1: Prisma Client Issue ❌ ELIMINATED
- **Test:** Checked `node_modules/.prisma/client` existence
- **Result:** Client exists and properly generated
- **Evidence:** No generation errors, schema sync succeeded

### Hypothesis 2: Code Logic Bug ❌ ELIMINATED  
- **Test:** Reviewed auth service and controller code
- **Result:** Logic correct, no obvious bugs
- **Evidence:** Validation works (400 errors), routing functional

### Hypothesis 3: Schema Mismatch ❌ ELIMINATED
- **Test:** Ran `prisma db pull` to compare schema
- **Result:** Schema pull succeeded when DB was accessible
- **Evidence:** No schema validation errors

### Hypothesis 4: Database Server Down ✅ CONFIRMED
- **Test:** Port check, service check, Prisma connection test
- **Result:** All tests confirm PostgreSQL not running
- **Evidence:** P1001 error, empty port 5432, no Windows service

## Timeline

1. **16:18** - User reports 500 errors on `/auth/login` and `/auth/register`
2. **16:20** - Initial testing: validation works (400), DB operations fail (500)
3. **16:25** - Code review: logic correct, no obvious bugs
4. **16:30** - Prisma client check: generated successfully
5. **16:35** - Backend restart attempts reveal connection errors
6. **16:40** - **BREAKTHROUGH:** Backend logs show P1001 database connection error
7. **16:45** - **CONFIRMED:** PostgreSQL not running on port 5432

## Root Cause Statement

**PostgreSQL database server is not running.** The application cannot connect to the database, causing all authentication operations that require database access (user lookup, password verification, user creation) to fail with 500 errors.

## Fix Recommendations

### Immediate Fix (Priority 1)

**Option A: Start PostgreSQL Service (if installed)**
```bash
# Check for PostgreSQL services
sc query | findstr -i postgres

# Start service (replace with actual service name)
net start postgresql-x64-16
```

**Option B: Install PostgreSQL (if not installed)**
```bash
# Download PostgreSQL installer
# https://www.postgresql.org/download/windows/

# Or use package manager
winget install PostgreSQL.PostgreSQL
```

**Option C: Use Docker (recommended for development)**
```bash
docker run --name chinese-learning-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=chinese_learning \
  -p 5432:5432 \
  -d postgres:16
```

### Alternative Solutions (Priority 2)

**Option D: Switch to SQLite (development only)**
```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Option E: Use Cloud PostgreSQL**
```env
# Supabase, Railway, Neon, etc.
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

## Verification Steps

After fix:
1. **Verify PostgreSQL running:** `netstat -ano | findstr :5432`
2. **Test connection:** `npx prisma db push`
3. **Start backend:** `npm run start:dev`
4. **Test endpoints:**
   ```bash
   # Register
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","username":"testuser","password":"password123"}'
   
   # Login
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123"}'
   ```

## Prevention Measures

1. **Add health check endpoint:**
   ```typescript
   @Get('health')
   async health() {
     try {
       await this.prisma.$queryRaw`SELECT 1`;
       return { status: 'ok', database: 'connected' };
     } catch (error) {
       return { status: 'error', database: 'disconnected' };
     }
   }
   ```

2. **Add startup dependency check:**
   ```typescript
   async onModuleInit() {
     try {
       await this.$connect();
       console.log('✅ Database connected');
     } catch (error) {
       console.error('❌ Database connection failed');
       throw error; // Prevent app startup
     }
   }
   ```

3. **Document environment setup:** Update README with database requirements

4. **Add pre-start script:** Check database availability before starting server

## Unresolved Questions

1. Was PostgreSQL previously installed and running? (If yes, why did it stop?)
2. Is this a development environment or production deployment?
3. Are there any database backups that need to be restored?
4. What's the preferred database solution for this project? (Local vs Cloud vs Docker)

## Summary

**Root cause confirmed:** PostgreSQL database server not running  
**Fix required:** Start/install PostgreSQL and verify connection  
**Time to resolve:** 5-30 minutes depending on solution chosen  
**Risk level:** HIGH until fixed - authentication completely non-functional

---

**Report Status:** COMPLETE - Root cause identified with actionable fix recommendations  
**Next Action:** Implement fix and verify endpoints working  
**Follow-up:** Add monitoring to prevent future occurrences