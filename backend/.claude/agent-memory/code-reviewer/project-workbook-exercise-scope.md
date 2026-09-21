---
name: project-workbook-exercise-scope
description: Workbook exercise plan (260921-1015) partially superseded — crop workflow dropped, images uploaded via UI instead; plan.md text still describes cropping
metadata:
  type: project
---

The delivered workbook-exercise scope (2026-09-21) differs from plan `plans/260921-1015-workbook-exercise-scan-pipeline/plan.md`: the manual crop workflow was dropped; exercise images now arrive as PNG/JPG/WebP uploads through the UI (`POST /exercises/images/:imageId/file`), with the importer CLI only copying audio + reporting missing images as "pending upload". The importer also resets `cropBox` to null on upsert.

**Why:** User changed workflow mid-plan; plan.md "Key decisions" item 3 ("Ảnh = crop tay có tool") was never updated, so plan text contradicts shipped code.

**How to apply:** When reviewing or planning against this plan, trust the code (`backend/src/exercises/`, `frontend/src/components/exercises/`) over plan.md for image handling; treat any new crop-related task as new scope, not a plan phase.
