---
phase: 6
title: Import Extraction
status: completed
priority: P2
effort: 2h
dependencies:
  - '1'
---

# Phase 6: Import Extraction

## Overview

Trích xuất trang Import (admin tool). Domain: `import`.

## Requirements

- Functional: password gate, upload zone, progress, nút, confirm text dùng `t()`
- Non-functional: message validation JSON kỹ thuật (validation-errors.tsx hiển thị `error.message` từ parser) giữ nguyên trạng raw — là lỗi dữ liệu nội bộ, không phải UI text

## Architecture

- Files: `import-page`, `import-password-gate` (5), `file-upload-zone`, `import-progress`, `validation-errors` (khung UI thôi — heading/nút, không dịch nội dung lỗi)
- Lỗi gate sai mật khẩu: kiểm tra backend trả gì → nếu message đã biết thì thêm vào map `translateApiError`, nếu không dùng key chung `errors.unknown`
- Import là admin-only — ưu tiên thấp, text ít (~50 string)

## Related Code Files

- Modify: `frontend/src/pages/import/import-page.tsx`, `import-password-gate.tsx`, `frontend/src/pages/import/components/file-upload-zone.tsx`, `import-progress.tsx`, `validation-errors.tsx`
- Modify: `frontend/src/i18n/locales/vi.json` (thêm `import`)
- Create: none

## Implementation Steps

1. Extract `import-password-gate`: placeholder, nút, lỗi sai mật khẩu
2. Extract `file-upload-zone` + `import-page`: drag-drop hint, nút import, confirm
3. Extract `import-progress` + khung `validation-errors` (heading, nút đóng/quay lại)
4. Build pass + tự test flow vào trang import (có gate)

## Success Criteria

- [ ] 0 string tiếng Việt hardcode trong files trên (trừ message validation JSON raw)
- [ ] Gate hoạt động nguyên trạng

## Risk Assessment

- Thấp — trang đơn giản, ít dùng

## Security Considerations

- Password gate: KHÔNG hardcode mật khẩu trong text key; placeholder không echo mật khẩu
