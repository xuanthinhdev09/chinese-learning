# Code Review: Import UI Wizard Implementation

**Date:** 2026-07-21
**Reviewer:** code-reviewer
**Scope:** Import UI Wizard implementation

---

## Summary

Build passes. Acceptance criteria mostly met. Found **1 critical bug** and several type safety issues that should be addressed before merge.

---

## Critical Issues

### [C1] Missing lesson_mapping in Conversations Import
**File:** `src/pages/import/hooks/use-import-mutations.ts:84`

**Problem:** Conversations mutation passes empty object for `lesson_mapping`:
```typescript
lesson_mapping: {}, // Get from store if needed
```

The store destructuring at line 69 only includes `vocabularies`, not `lessons`. The `lessons.result.mapping` is unavailable.

**Impact:** Conversations import will fail or produce incorrect results. API contract requires both `lesson_mapping` AND `vocab_mapping`.

**Fix:**
```typescript
// Line 69: Add lessons to destructuring
const { vocabularies, lessons, setConversationsResult, setIsImporting } = useImportStore();

// Line 84: Use lessons mapping
lesson_mapping: lessons.result?.mapping || {},
```

---

## High Priority Issues

### [H1] Type Safety - Excessive `any` Usage
**File:** `src/pages/import/import-page.tsx:21-23, 292, 298-299`

Multiple `any` types instead of proper interfaces:

```typescript
// Lines 21-23 - StepValidation
interface StepValidation {
  lessons: any;
  vocabularies: any;
  conversations: any;
}

// Lines 292, 298-299 - ImportStepProps
result?: any;
mutationError: Error | null;
progress: any;
validation: any;
```

**Fix:** Use proper types:
```typescript
import type { ImportLessonsResponse, ImportVocabulariesResponse, ImportConversationsResponse } from '../../api/import-api';
import type { ValidationResult } from './hooks/use-json-validation';

interface StepValidation {
  lessons: ValidationResult | null;
  vocabularies: ValidationResult | null;
  conversations: ValidationResult | null;
}
```

### [H2] Missing Error Type for Mutation
**File:** `src/pages/import/import-page.tsx:297`

`mutationError: Error | null` is incorrect. TanStack Query mutations have `Error | null` at `mutation.error`, but the type should be `unknown` for proper error handling.

### [H3] Simulated Progress - Known Placeholder
**File:** `src/pages/import/hooks/use-import-progress.ts:28-47`

Progress is simulated with `setInterval`. Already documented as placeholder. Acceptable for MVP but should be tracked for real implementation.

---

## Medium Priority Issues

### [M1] Duplicate Validation Logic
**File:** `src/pages/import/components/file-upload-zone.tsx:64-72`

File validation duplicated from `useFileUpload` hook. The hook already validates, but `FileUploadZone` also validates inline.

**Recommendation:** Let hook handle validation, remove duplicate code.

### [M2] Unused return value in validateFile
**File:** `src/pages/import/components/file-upload-zone.tsx:29-33`

```typescript
const validationError = validateFile(droppedFile);
setFile(droppedFile);
if (!validationError) {
  onFileSelect(droppedFile);
}
```

`validationError` is checked but `setFile` is called regardless. The error handling in `useFileUpload` is the source of truth.

### [M3] Missing Dependency Injection for Progress Polling
**File:** `src/pages/import/hooks/use-import-progress.ts`

The hook is hardcoded for simulation. No way to inject real polling logic. Will require breaking change when implementing real progress tracking.

---

## Low Priority Issues

### [L1] Inconsistent Error Handling
**File:** `src/pages/import/import-page.tsx:126-128`

Generic try-catch with `console.error`. Should surface error to user.

### [L2] CSS Import Warning
**Build Output:**
```
[vite:css] @import must precede all other statements
```

Import order in CSS file should be fixed but doesn't block functionality.

---

## Acceptance Criteria Verification

| Criterion | Status | Notes |
|-----------|--------|-------|
| Wizard at `/import` with 3 steps | ✅ PASS | Route configured in App.tsx:88 |
| File upload accepts JSON (drag + click) | ✅ PASS | FileUploadZone implements both |
| Real-time progress display | ⚠️ PARTIAL | Simulated progress (known placeholder) |
| Validation errors block import | ⚠️ PARTIAL | Basic validation implemented |
| Each step executable independently | ✅ PASS | Steps can be run separately |
| Public access (no auth) | ✅ PASS | No ProtectedRoute wrapper |

---

## Blast Radius Analysis

### Files Changed
- `src/App.tsx` - Added `/import` route (public)
- `src/components/layout/header/header.tsx` - Added Import navigation link
- `src/api/import-api.ts` - New API client
- `src/stores/import-store.ts` - New Zustand store
- `src/pages/import/*` - New wizard implementation

### Regressions Found
- **App.tsx:** No regressions. Public route correctly isolated.
- **header.tsx:** No regressions. Navigation only visible when `isAuthenticated`.
- **api-client.ts:** No changes to existing fetch wrapper. Import API uses same client.

### Breaking Changes
- None to existing public contracts.
- **Critical:** New bug in conversations import breaks new feature (C1).

---

## Code Patterns Analysis

### Follows Existing Patterns
- Zustand store pattern matches `auth-store.ts`
- TanStack Query mutation pattern matches existing mutations
- Routing pattern matches existing protected/public routes

### Deviations
- Import mutations use inline file parsing (`file.text()`) instead of centralizing in API client
- Progress hook not aligned with existing polling patterns (none exist)

---

## Unresolved Questions

1. **Q1:** Is simulated progress acceptable for MVP, or is real progress polling required?
2. **Q2:** Should lesson_mapping for conversations come from lessons result or separate source?

---

## Metrics

- **Type Coverage:** TypeScript compiles without errors
- **Build Status:** ✅ Passes (3.99s)
- **Lint Status:** ⚠️ No ESLint config found
- **Files Reviewed:** 11
- **Lines of Code:** ~800

---

## Recommended Actions

### Before Merge (Blocking)
1. **FIX C1:** Add `lessons` to conversations mutation destructuring, pass `lessons.result.mapping`
2. **FIX H1:** Replace `any` types with proper interfaces

### Post-Merge (Non-Blocking)
3. Track simulated progress replacement (H3)
4. Add real progress polling infrastructure
5. Duplicate validation cleanup (M1)
6. CSS import order fix (L2)

---

## Status

**Recommendation:** **BLOCK** - Critical bug (C1) must be fixed before merge. Type safety issues (H1) should also be addressed.

**Overall:** Implementation is solid structure-wise but has a data flow bug that breaks the conversations import step.
