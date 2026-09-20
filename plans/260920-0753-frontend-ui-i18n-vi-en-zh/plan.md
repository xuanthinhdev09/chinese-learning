---
title: Frontend UI i18n VI EN ZH
description: >-
  i18n toàn bộ text giao diện frontend (VI default + EN + ZH) bằng
  react-i18next, loại trừ nội dung bài học; map lỗi backend tiếng Anh sang key
  dịch
status: completed
priority: P2
branch: main
tags:
  - i18n
  - frontend
  - react-i18next
  - ui
blockedBy: []
blocks: []
created: '2026-09-20T01:04:52.638Z'
createdBy: 'ck:plan'
source: skill
---

# Frontend UI i18n VI EN ZH

## Overview

Thay toàn bộ text giao diện hardcode (37/54 file .tsx, ~500 string) bằng `react-i18next`, 3 locale: `vi` (default, nguồn gốc) + `en` + `zh`. Toggle VI/EN/ZH ở Header, persist localStorage. Map error message backend tiếng Anh sang key dịch. **Loại trừ** nội dung bài học từ DB (từ vựng, hội thoại, lyrics) và `language-preference-store` (VN/EN/both nghĩa từ).

Context: [brainstorm report](../reports/brainstorm-260920-0753-frontend-ui-i18n-vi-en-zh-report.md) — design đã user duyệt (thư viện, switcher, default vi, map lỗi, phạm vi gồm import).

Quy ước chung mọi phase:
- Key nested 2 cấp theo domain trong `vi.json`: `common`, `nav`, `auth`, `dashboard`, `hsk`, `lesson`, `today`, `vocabulary`, `profile`, `import`, `errors`
- Viết `vi.json` incremental theo phase; `en.json`/`zh.json` điền full ở phase 7 (i18next fallback `vi` nên UI không vỡ trong lúc làm)
- Interpolation `t(key, {var})` — cấm nối chuỗi text
- Sau mỗi phase: `npm run build` (tsc + vite) pass
- Mẫu file phase dùng template chuẩn `phase-XX-*.md` trong thư mục này

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [i18n Infrastructure](./phase-01-i18n-infrastructure.md) | Completed |
| 2 | [Layout Common Auth Extraction](./phase-02-layout-common-auth-extraction.md) | Completed |
| 3 | [Dashboard HSK Lesson Extraction](./phase-03-dashboard-hsk-lesson-extraction.md) | Completed |
| 4 | [Today Extraction](./phase-04-today-extraction.md) | Completed |
| 5 | [Vocabulary Profile Extraction](./phase-05-vocabulary-profile-extraction.md) | Completed |
| 6 | [Import Extraction](./phase-06-import-extraction.md) | Completed |
| 7 | [EN ZH Translations Parity](./phase-07-en-zh-translations-parity.md) | Completed |

## Dependencies

- Nội bộ: phase 2-6 phụ thuộc phase 1 (infra); phase 7 phụ thuộc phase 2-6 (cần đủ key trong vi.json)
- Cross-plan: không có — các plan cũ đã done; MVP plan còn lại E2E/deploy không đụng file text frontend

## Success Criteria

- `npm run build` pass toàn bộ
- 3 file JSON cùng bộ key (parity check script)
- Grep không còn dấu tiếng Việt hardcode trong JSX ngoài `vi.json` (trừ dữ liệu bài học)
- Đổi ngôn ngữ ở Header cập nhật tức thì, refresh giữ lựa chọn, lần đầu luôn `vi`
- Lỗi backend đã map (sai mật khẩu, trùng username...) hiện theo ngôn ngữ đã chọn
