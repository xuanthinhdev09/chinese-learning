# Codebase Summary

Tổng quan cấu trúc repo `chinese-learning`: app học tiếng Trung HSK (private, nội dung sách bản quyền BLCUP — mọi API nội dung bắt buộc auth).

```
chinese-learning/
├── backend/            # NestJS + Prisma + PostgreSQL
├── frontend/           # React + Vite + TypeScript
├── docs/               # tài liệu dự án
└── plans/              # kế hoạch triển khai theo đợt
```

Nội dung nguồn (PDF scan, OCR cache, JSON extracted, audio) nằm ngoài repo tại `C:/My Work/chinese-learning/content-source/` — xem `docs/textbook-scan-extraction-workflow.md`.

## Backend (`backend/src/`)

| Thư mục | Nội dung |
|---|---|
| `auth` | JWT passphrase auth, guards |
| `users` | Người dùng, preference |
| `hsk` | Course HSK |
| `lessons` | Lesson giáo khoa: vocab, hội thoại |
| `vocabulary` | Từ vựng, khóa tuần tự theo lesson |
| `spaced-repetition` | Ôn tập ngắt quãng (SRS) |
| `daily-session` | Buổi học hằng ngày |
| `tts` | Azure TTS + cache disk (`storage/tts`) |
| `exercises` | **Bài tập sách bài tập (21/09):** `ExercisesModule` — `GET /exercises/lesson/:lessonId`, `GET|POST /exercises/images/:imageId/file` (upload 5MB), `GET /exercises/audio/:filename`; JWT toàn bộ, upload throttle 30/phút; storage port `ExerciseMediaStorage` (env `EXERCISE_IMAGE_STORAGE_DIR`/`EXERCISE_AUDIO_STORAGE_DIR`, regex whitelist + resolve-in-root). Media không public (bản quyền) |
| `import` | Pipeline nội dung: giáo khoa v2 (`TextbookV2Importer`) + **sách bài tập v3 (`workbook/` — `json-v3.validator.ts` 12 typeCodes, `workbook-v3.importer.ts` idempotent)**; CLI `npm run import:workbook -- --file <lesson-NN.json>` |
| `prisma` | Prisma client; schema có `Exercise` (payload Json per typeCode) + `ExerciseImage` (filePath unique per lesson, cropBox nullable không dùng) |
| `scripts` | CLI import (`import-textbook-v2`...) |

Chi tiết kiến trúc exercises: `docs/system-architecture.md` §3.

## Frontend (`frontend/src/`)

| Thư mục | Nội dung |
|---|---|
| `api/` | API clients (jwt interceptor); `exercises-api.ts` — fetch JSON + media blob có Authorization |
| `components/exercises/` | **(21/09)** `exercise-card.tsx` dispatch 12 typeCodes → 7 renderer (TfJudge, PicturePool, TextOptions, PinyinPair, RadicalGroups, Drill, StrokeOrder); `exercise-image-slot.tsx` upload ảnh inline; audio player, bits |
| `components/` | layout (header, language-toggle), lesson, study, import... |
| `pages/lessons/` | `lesson-detail-page.tsx` (nút "Luyện bài tập"), `lesson-exercises-page.tsx` — route `/lessons/:lessonId/exercises` |
| `hooks/` | `use-exercise-media.ts` — media blob → object URL qua react-query (img/audio không gửi được Authorization header) |
| `i18n/` | react-i18next VI/EN/ZH (`locales/{vi,en,zh}.json`, `vi` là nguồn chuẩn) |
| `stores/` | Zustand stores |
| `lib/` | `api-client.ts` (get/post/postForm) |

## Content source (ngoài repo)

`content-source/extracted-wb/` — data frame v3 per-lesson cho sách bài tập; `content-source/audio/hsk2/` — audio đề nghe gốc; pipeline Python + tools trong `content-source/tools/`.

## Docs

- `docs/system-architecture.md` — kiến trúc, chi tiết subsystem exercises
- `docs/textbook-scan-extraction-workflow.md` — pipeline trích xuất giáo khoa + sách bài tập
- `docs/project-changelog.md` — nhật ký thay đổi
- `docs/deployment-guide.md`, `docs/vps-deploy-runbook.md` — triển khai VPS
