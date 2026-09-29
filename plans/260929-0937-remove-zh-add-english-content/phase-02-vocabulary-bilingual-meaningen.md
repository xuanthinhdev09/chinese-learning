---
phase: 2
title: Từ vựng song ngữ meaningEn
status: completed
priority: P1
effort: 4h
dependencies: []
---

# Phase 2: Từ vựng song ngữ (meaningEn)

## Overview

Thêm nghĩa English cho từ vựng: migration `meaningEn`, dọn nghĩa Việt lỗi/trống, dịch AI → English, hiển thị theo `language-preference`.

## Requirements

- Functional: flashcard/quiz/today hiển thị nghĩa English khi preference = english; nghĩa Việt đã dọn (hết watermark, đủ 171 nghĩa).
- Non-functional: migration additive (không drop cột), không vỡ dữ liệu cũ; build pass.

## Architecture

- `Vocabulary.meaning` (hiện = nghĩa Việt, có lỗi) giữ nguyên làm nguồn nghĩa Việt → dọn tại chỗ.
- Thêm `Vocabulary.meaningEn String?` chứa nghĩa English.
- Frontend `parseMeaning` (hiện split `|` SAI so với data) → bỏ, dùng `meaningEn` cho english, `meaning` cho vietnamese.
- `getDisplayMeaning(vietnamese, english, preference)` + `language-preference-store` đã có sẵn, không đổi.

## Related Code Files

- Modify: `backend/prisma/schema.prisma` (thêm `meaningEn String?` vào model Vocabulary)
- Create: migration Prisma `add_vocabulary_meaning_en` (`npx prisma migrate dev --name add_vocabulary_meaning_en`)
- Modify: `backend/src/vocabulary/dto/vocabulary.dto.ts` (thêm `meaningEn: string | null`)
- Modify: `backend/src/vocabulary/vocabulary.service.ts` (map `meaningEn` trong response)
- Modify: `frontend/src/api/vocabulary-api.ts` (bỏ `parseMeaning` sai; `english = meaningEn`, `vietnamese = meaning`)
- Create (ngoài repo): `content-source/tools/translate-vocab-meanings.py` (Gemini)
- (Không sửa) `frontend/src/stores/language-preference-store.ts`, `frontend/src/components/vocabulary/*` — tự hưởng qua API

## Implementation Steps

1. Migration: thêm cột `meaningEn` vào `Vocabulary` (nullable), chạy `npx prisma migrate dev`.
2. Backend: `vocabulary.dto.ts` + `vocabulary.service.ts` trả `meaningEn` trong payload (giữ `meaning` nguyên).
3. Frontend API: `vocabulary-api.ts` — bỏ `parseMeaning`; `processVocabulary` set `english = item.meaningEn ?? ''`, `vietnamese = item.meaning`.
4. Script dịch (content-source): đọc 171 từ (từ DB qua psql/script), LLM sinh `{vi_fixed, en}` — dọn watermark/nghĩa sai, điền 53 từ trống (đối chiếu `content-source/meaning-fix-audit.json`), xuất file review `content-source/vocab-bilingual-<date>.json`.
5. User review file → script apply: `UPDATE vocabularies SET meaning = vi_fixed, meaning_en = en`.
6. Verify UI: flashcard/quiz hiển thị đúng theo preference.

## Success Criteria

- [ ] DB có cột `meaning_en`; 171 từ đều có nghĩa Việt sạch + nghĩa English.
- [ ] Flashcard/quiz hiển thị nghĩa English khi preference = english; Việt khi vietnamese; cả hai khi both.
- [ ] Không còn watermark `www.nhantriviet.com` / nghĩa sai (可能 → "có thể").

## Risk Assessment

- Gloss hỏng lan sang English nếu dịch từ bản Việt lỗi → dọn `vi` trước khi dịch (đã chốt).
- `meaning` bị nhiều component đọc trực tiếp → giữ `meaning` = nghĩa Việt (không đổi nghĩa cột), chỉ thêm `meaningEn` → tránh vỡ.
- Đọc DB ngoài repo cần ssh tunnel (VPS) → tái dùng pattern `content-source/tools/` có sẵn.
