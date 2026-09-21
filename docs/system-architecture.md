# System Architecture

Tài liệu kiến trúc hệ thống. Phần subsystem mới nhất (bài tập sách bài tập) được mô tả chi tiết ở §3; các subsystem cũ tham khảo `docs/codebase-summary.md` và plan `plans/260907-0949-daily-session-content-pipeline/`.

## 1. Tổng quan stack

- **Backend:** NestJS (TypeScript) tại `backend/` — module hóa theo domain, Prisma ORM, PostgreSQL (VPS 91.99.69.228, dev truy cập qua ssh tunnel local 5433→5432), auth JWT (passport-jwt), rate-limit `@nestjs/throttler` (mặc định 10 req/phút).
- **Frontend:** React + Vite + TypeScript tại `frontend/` — react-router, TanStack Query (react-query), Zustand stores, react-i18next (VI/EN/ZH).
- **Content pipeline:** script Python tách biệt ở `C:/My Work/chinese-learning/content-source/` (ngoài repo) + CLI import trong backend; nội dung sách bản quyền BLCUP — app private, mọi API nội dung bắt buộc auth, **không serve public**.

## 2. Module map (backend `src/`)

| Module | Vai trò |
|---|---|
| `auth` | Đăng nhập passphrase/JWT, guard |
| `users` | Người dùng, preference |
| `hsk` | Course HSK |
| `lessons` | Lesson + nội dung giáo khoa (vocab, hội thoại) |
| `vocabulary` | Từ vựng, khóa tuần tự theo lesson |
| `spaced-repetition` | Ôn tập ngắt quãng |
| `import` | Import nội dung: giáo khoa v2 + sách bài tập v3 (`workbook/`) |
| `daily-session` | Buổi học hằng ngày |
| `tts` | Azure TTS, cache disk (`TtsStorageService`) |
| `exercises` | Bài tập sách bài tập (mới, 21/09) — chi tiết §3 |

Frontend route liên quan: `/lessons/:lessonId` (lesson detail), `/lessons/:lessonId/exercises` (luyện bài tập).

## 3. Subsystem Exercises (bài tập sách bài tập)

### 3.1 Data model (Prisma)

- `Exercise` — đề bài polymorphic: `(lessonId, order)` unique, `section` (听力/阅读/语音/汉字), `typeCode` (1 trong 12, hardcode thành TS const trong `import/workbook/json-v3.validator.ts`), `instructionHanzi/Vi`, `payload Json` (shape theo typeCode). Cascade delete theo Lesson.
- `ExerciseImage` — ảnh tham chiếu từ payload qua `filePath`; `(lessonId, filePath)` unique; `exerciseId` optional (pool ảnh dùng chung cho cả đề); `cropBox` nullable — giữ cột nhưng workflow crop đã bỏ, không dùng.
- Migrations: `20260921042527_add_workbook_exercise_tables`, `20260921160000_add_exercise_image_file_path_unique`.

### 3.2 API (`exercises/exercises.controller.ts`)

| Route | Ý nghĩa |
|---|---|
| `GET /exercises/lesson/:lessonId` | Đề + ảnh của 1 bài |
| `GET /exercises/images/:imageId/file` | Stream file ảnh (`StreamableFile`, `Cache-Control: private, max-age=86400`) |
| `POST /exercises/images/:imageId/file` | Upload ảnh (multer, giới hạn 5MB, mime phải khớp ext) |
| `GET /exercises/audio/:filename` | Stream audio đề nghe (`NN-1.mp3`/`NN-2.mp3`) |

Toàn bộ route JWT-guarded. Throttle: `@SkipThrottle()` class-level (1 trang bài tải ~27 ảnh cùng lúc), riêng upload re-enable `@SkipThrottle({ default: false })` + `@Throttle` 30 req/phút.

### 3.3 Storage & path safety (`exercises/exercise-media.storage.ts`)

Port `ExerciseMediaStorage`, 2 gốc disk (pattern `TtsStorageService`):

- `EXERCISE_IMAGE_STORAGE_DIR` (mặc định `storage/exercise-images`) — file theo path tương đối `lesson-NN/ten.png`
- `EXERCISE_AUDIO_STORAGE_DIR` (mặc định `storage/exercise-audio`) — file theo tên `NN-N.mp3`

Path safety 2 lớp: input phải khớp regex whitelist (ảnh `^lesson-\d{2}/[A-Za-z0-9_-]+\.(png|jpe?g|webp)$`, audio `^\d{2}-[12]\.mp3$`), rồi path resolve xong phải nằm trong gốc storage. Upload không bao giờ nhận path từ client — `filePath` chỉ lấy từ row `ExerciseImage` trong DB.

### 3.4 Media-serving auth pattern (blob fetch)

`<img>`/`<audio>` không gửi được header Authorization, nên frontend KHÔNG trỏ src thẳng vào endpoint. Pattern:

1. `api/exercises-api.ts` fetch media bằng `fetch` có Authorization → nhận blob
2. `hooks/use-exercise-media.ts` wrap bằng react-query; object URL (`URL.createObjectURL`) tạo **trong `queryFn`** — stable per fetch, tránh leak mỗi render
3. Component dùng object URL làm src; browser tự revoke khi cache stale

Đây là pattern bắt buộc cho mọi media có JWT sau này.

### 3.5 Import pipeline (`import/workbook/`)

```
content-source/extracted-wb/lesson-NN.json (data frame v3)
  → npm run import:workbook -- --file <path>
  → json-v3.validator.ts (12 typeCodes TS const, errors[]/warnings[])
  → workbook-v3.importer.ts (1 transaction):
      Exercise upsert theo (lessonId, order) — map exerciseIdByOrder,
        KHÔNG phụ thuộc thứ tự mảng
      ExerciseImage upsert theo (lessonId, filePath)
      Row stale (không còn trong file) → deleteMany
      Copy media best-effort → storage dir; thiếu file chỉ warning
  → ảnh thật nạp sau qua POST upload từ UI
```

Answer key do user paste vào file JSON per bài; thiếu ảnh/audio không chặn import — re-import sau khi bổ sung là đủ (idempotent).

## Unresolved questions

- Import prod (phase 5) chưa chạy — cần kiểm tra volume mount cho `storage/exercise-*` trên VPS trước khi import.
