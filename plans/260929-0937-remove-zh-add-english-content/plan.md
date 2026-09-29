---
title: Remove zh + add English content (vocab + exercises)
description: >-
  Bỏ ngôn ngữ zh khỏi i18n UI; bổ sung nghĩa English cho từ vựng (meaningEn) và
  gloss English cho bài tập sách bài tập; hiển thị song ngữ theo
  language-preference
status: completed
priority: P2
branch: main
tags:
  - i18n
  - vocabulary
  - exercises
  - bilingual
  - content
blockedBy: []
blocks: []
created: '2026-09-29T03:03:52.201Z'
createdBy: 'ck:plan'
source: skill
---

# Bỏ `zh` + bổ sung English cho nội dung (từ vựng + bài tập)

## Overview

1. **Bỏ `zh`** khỏi ngôn ngữ giao diện — UI còn `vi` (default) + `en`.
2. **Từ vựng song ngữ** — thêm cột `meaningEn`, dọn nghĩa Việt (hết watermark/lỗi, điền từ trống), dịch AI → English, hiển thị theo `language-preference` (đã có sẵn).
3. **Bài tập song ngữ** — dịch gloss `vi → en` vào JSON nguồn, re-import, renderers hiển thị gloss song ngữ.

## Context

- Brainstorm report: [`plans/reports/brainstorm-260929-0937-remove-zh-add-english-content-report.md`](../reports/brainstorm-260929-0937-remove-zh-add-english-content-report.md)
- Kiến trúc: [`docs/system-architecture.md`](../../docs/system-architecture.md) (§3 exercises), [`docs/codebase-summary.md`](../../docs/codebase-summary.md)

## Key decisions (từ brainstorm, user đã chốt)

| Quyết định | Giá trị |
|---|---|
| Phạm vi English | Từ vựng + bài tập |
| Cách dịch | AI (Gemini) hàng loạt + review qua file |
| Chất lượng dữ liệu | Sửa cả nghĩa Việt lẫn English |
| Hiển thị gloss bài tập | Song ngữ theo `language-preference` |
| Cách review bản dịch | Qua file (không build UI admin mới) |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Bỏ ngôn ngữ zh](./phase-01-remove-zh-ui-language.md) | Completed |
| 2 | [Từ vựng song ngữ meaningEn](./phase-02-vocabulary-bilingual-meaningen.md) | Completed |
| 3 | [Bài tập song ngữ gloss](./phase-03-exercise-bilingual-gloss.md) | Completed |

## Dependencies

- Không `blockedBy` plan nào. Plan i18n cũ `260920-0753-frontend-ui-i18n-vi-en-zh` đã `completed` — phase 1 đảo ngược một phần quyết định cũ (bỏ `zh`).
- Phase 2 & 3 độc lập, có thể song song. Cả hai tái dùng `language-preference-store` + `getDisplayMeaning` (có sẵn).
- Script dịch AI chạy ngoài repo (`content-source/tools/`), tách khỏi code in-repo.
