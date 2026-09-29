---
phase: 1
title: Bỏ ngôn ngữ zh
status: completed
priority: P1
effort: 0.5h
dependencies: []
---

# Phase 1: Bỏ ngôn ngữ zh

## Overview

Loại `zh` khỏi i18n UI, giữ `vi` (default) + `en`. Không đụng giọng TTS tiếng Trung.

## Requirements

- Functional: Header language toggle chỉ còn VI/EN; chọn EN hiển thị đúng; người dùng đang lưu `zh` tự rơi về `vi`.
- Non-functional: build TS + Vite pass; grep không còn ref `zh` UI (trừ TTS voice).

## Architecture

- `i18n/index.ts` là source-of-truth cho danh sách ngôn ngữ UI (`UiLanguage`, `UI_LANGUAGES`, `isUiLanguage`, `resources`).
- `exercise-card.tsx` có nhánh `i18n.language.startsWith('zh')` để ẩn dòng instruction dịch — bỏ nhánh này, instruction luôn hiện.
- `use-chinese-tts.ts` dùng `lang.startsWith('zh')` để **chọn giọng TTS** (nói tiếng Trung) — GIỮ NGUYÊN, không liên quan UI.

## Related Code Files

- Modify: `frontend/src/i18n/index.ts`
- Modify: `frontend/src/components/exercises/exercise-card.tsx`
- Delete: `frontend/src/i18n/locales/zh.json`
- (Không sửa) `frontend/src/hooks/use-chinese-tts.ts`

## Implementation Steps

1. `i18n/index.ts`: đổi `type UiLanguage = 'vi' | 'en'`; bỏ `import zh`; xóa `{ code: 'zh', label: 'ZH' }` khỏi `UI_LANGUAGES`; `isUiLanguage` bỏ nhánh `'zh'`; bỏ `zh: { translation: zh }` khỏi `resources`.
2. Xóa `frontend/src/i18n/locales/zh.json`.
3. `exercise-card.tsx:96-100`: bỏ nhánh `startsWith('zh')` — `instructionLine` luôn = `i18n.exists(instrKey) ? t(instrKey) : exercise.instructionVi`.
4. Chạy `npm run build` (frontend) — xác nhận pass.
5. Grep `'zh'` / `"zh"` trong `frontend/src` — chỉ còn `use-chinese-tts.ts` (TTS voice).

## Success Criteria

- [ ] Language toggle hiển thị VI + EN (không còn ZH).
- [ ] User localStorage `ui-language = zh` cũ → app khởi động bằng `vi`.
- [ ] Build pass; grep không còn `zh` UI (trừ `use-chinese-tts.ts`).

## Risk Assessment

- Sót ref `zh` ở file khác (store/component import `UiLanguage`) → build/grep phát hiện. Mitigate: grep toàn `frontend/src`.
- User đang ở `zh` thấy UI đổi đột ngột → chấp nhận (default `vi`, là ngôn ngữ mặc định gốc).
