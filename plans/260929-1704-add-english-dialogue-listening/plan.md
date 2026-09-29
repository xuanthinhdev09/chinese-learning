---
title: Add English content for dialogue/listening (课文)
description: >-
  Bổ sung nghĩa English cho 230 dòng hội thoại (课文/listening): thêm cột english
  vào Conversation, dịch vi→en, hiển thị theo ngôn ngữ UI
status: completed
priority: P2
branch: main
tags:
  - dialogue
  - listening
  - bilingual
  - content
blockedBy: []
blocks: []
created: '2026-09-29T10:07:22.628Z'
createdBy: 'ck:plan'
source: skill
---

# Bổ sung English cho phần hội thoại/listening (课文)

## Overview

1. **Schema + backend** — thêm cột `english` vào `Conversation`, wire qua DTO + mapper + daily-session.
2. **Dịch + sync** — dịch 230 dòng `vietnamese → english`, sync vào DB.
3. **Frontend** — hiển thị nghĩa theo ngôn ngữ UI (en → English, vi → Vietnamese).

Tái dùng hạ tầng đã xây từ plan trước (`getDisplayMeaning`, `useContentPreference`).

## Context

- Plan trước (đã xong): `plans/260929-0937-remove-zh-add-english-content/` — từ vựng + bài tập đã có English.
- Hội thoại: `Conversation` model có `vietnamese` (cột), 230 dòng / 15 bài; nguồn `content-source/extracted-v2/conversations-lesson-NN.json`.
- Hiển thị: `lyrics-panel.tsx` (`{line.vietnamese}`) — theo toggle `showVietnamese`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Schema backend dialogue English](./phase-01-schema-backend-dialogue-english.md) | Completed |
| 2 | [Translate sync dialogue English data](./phase-02-translate-sync-dialogue-english-data.md) | Completed |
| 3 | [Frontend dialogue English display](./phase-03-frontend-dialogue-english-display.md) | Completed |

## Dependencies

- Không `blockedBy`. Tái dùng `getDisplayMeaning`/`useContentPreference` (đã có từ plan trước).
- Phase 1 → 2 → 3 tuần tự (schema trước, data sau, UI cuối).
