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
| `spaced-repetition` | Ôn tập ngắt quãng (SRS); **(26/09)** `getStreak` có freeze 1 ngày (1 ngày lỡ giữa 2 ngày học không reset streak) |
| `daily-session` | Buổi học hằng ngày + **(25/09)** `POST /activity-complete`, `GET /lesson-status?lessonId=` — 3 flag hoàn thành per-activity |
| `common` | **(25/09)** `admin.ts` — `isAdminEmail()` (env `ADMIN_EMAILS`, phân tách phẩy); dùng chung auth/users/vocabulary, bỏ qua khóa tuần tự |
| `tts` | Azure TTS + cache disk (`storage/tts`) |
| `exercises` | **Bài tập sách bài tập (21/09):** `ExercisesModule` — `GET /exercises/lesson/:lessonId`, `GET|POST /exercises/images/:imageId/file` (upload 5MB), `GET /exercises/audio/:filename`; JWT toàn bộ, upload throttle 30/phút; storage port `ExerciseMediaStorage` (env `EXERCISE_IMAGE_STORAGE_DIR`/`EXERCISE_AUDIO_STORAGE_DIR`, regex whitelist + resolve-in-root). Media không public (bản quyền) |
| `import` | Pipeline nội dung: giáo khoa v2 (`TextbookV2Importer`) + **sách bài tập v3 (`workbook/` — `json-v3.validator.ts` 12 typeCodes, `workbook-v3.importer.ts` idempotent)**; CLI `npm run import:workbook -- --file <lesson-NN.json>` |
| `prisma` | Prisma client; schema có `Exercise` (payload Json per typeCode) + `ExerciseImage` (filePath unique per lesson, cropBox nullable không dùng); **(25/09)** `UserProgress` thêm `vocabCompletedAt`/`dialogueCompletedAt`/`exercisesCompletedAt` (nullable) — `isCompleted` set true khi đủ 3 |
| `scripts` | CLI import (`import-textbook-v2`...) |

Chi tiết kiến trúc exercises: `docs/system-architecture.md` §3.

## Frontend (`frontend/src/`)

| Thư mục | Nội dung |
|---|---|
| `api/` | API clients (jwt interceptor); `exercises-api.ts` — fetch JSON + media blob có Authorization |
| `components/exercises/` | **(21/09)** `exercise-card.tsx` dispatch 12 typeCodes → 7 renderer (TfJudge, PicturePool, TextOptions, PinyinPair, RadicalGroups, Drill, StrokeOrder); `exercise-image-slot.tsx` upload ảnh inline; audio player, bits |
| `components/` | layout (header, mobile-menu, language-toggle), lessons (`stage-stepper.tsx`), today (dialogue-reader, practice-runner), study, import... |
| `pages/lessons/` | **(25/09) wizard 3 giai đoạn** — `lesson-learn-page.tsx` (route `/learn/:lessonId`, stepper chọn tự do 3 stage + **(26/09)** gợi ý mờ "nên làm" bước chưa xong, đủ 3 stage → banner + nút bài kế); `vocab-stage.tsx` (flashcard bắt buộc → quiz); `exercises-stage.tsx` (question checkable phải check hết, view-only tính done khi render); `completion-detection.ts` (pure helper `isExercisesStageComplete`); `legacy-lesson-redirect.tsx` — `/lessons/:order` + `/lessons/:order/exercises` → `/learn/:id`. **Orphaned** (không còn route): `lesson-detail-page.tsx`, `lesson-exercises-page.tsx` |
| `pages/dashboard/` | **(25/09)** trang chủ = điểm vào duy nhất: hero "bắt đầu học" → dẫn thẳng `/hsk` (router học tự chọn) + mục ôn tập → `/vocabulary/review` |
| `hooks/` | `use-exercise-media.ts` — media blob → object URL qua react-query (img/audio không gửi được Authorization header); `use-resolve-lesson-id.ts` (nhận order hoặc CUID); **(25/09)** `use-resolve-hsk-level-id.ts` — `/hsk/:id` nhận số level hoặc CUID |
| `i18n/` | react-i18next VI/EN/ZH (`locales/{vi,en,zh}.json`, `vi` là nguồn chuẩn) |
| `stores/` | Zustand stores |
| `lib/` | `api-client.ts` (get/post/postForm) |

**Route map (25/09):** `/` → `/dashboard`; `/dashboard` (điểm vào duy nhất), `/learn/:lessonId` (wizard), `/hsk`, `/hsk/:id`, `/vocabulary/study`, `/vocabulary/review`, `/profile`, `/import`; legacy ẩn khỏi nav: `/today`; redirect: `/lessons/:order` + `/lessons/:order/exercises` → `/learn/:id`.

**Nav (25/09):** bỏ 3 nút header + mobile menu (Hôm nay / Trình độ HSK / Từ Vựng) — header chỉ còn logo, language toggle, avatar dropdown; mobile menu chỉ còn hồ sơ + language toggle.

## Content source (ngoài repo)

`content-source/extracted-wb/` — data frame v3 per-lesson cho sách bài tập; `content-source/audio/hsk2/` — audio đề nghe gốc; pipeline Python + tools trong `content-source/tools/`.

## Docs

- `docs/system-architecture.md` — kiến trúc; §3 subsystem exercises, §4 luồng học 3 giai đoạn
- `docs/textbook-scan-extraction-workflow.md` — pipeline trích xuất giáo khoa + sách bài tập
- `docs/project-changelog.md` — nhật ký thay đổi
- `docs/deployment-guide.md`, `docs/vps-deploy-runbook.md` — triển khai VPS
