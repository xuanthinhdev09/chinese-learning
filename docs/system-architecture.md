# System Architecture

Tài liệu kiến trúc hệ thống. Subsystem bài tập sách bài tập mô tả ở §3; luồng học 3 giai đoạn (unified lesson wizard, 25/09) ở §4; các subsystem cũ tham khảo `docs/codebase-summary.md` và plan `plans/260907-0949-daily-session-content-pipeline/`.

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
| `daily-session` | Buổi học hằng ngày + 3-flag progress (§4) |
| `tts` | Azure TTS, cache disk (`TtsStorageService`) |
| `exercises` | Bài tập sách bài tập (mới, 21/09) — chi tiết §3 |
| `common` | Tiện ích dùng chung — `admin.ts` (`isAdminEmail`, §4.3) |

Frontend route liên quan: `/learn/:lessonId` (wizard 3 giai đoạn, §4). Route cũ `/lessons/:lessonId` và `/lessons/:lessonId/exercises` chỉ còn là redirect về `/learn/:id`.

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

## 4. Luồng học 3 giai đoạn (unified lesson wizard, 25/09)

Thay thế luồng cũ `/today` (1 nút "hoàn thành bài") bằng wizard 1 route `/learn/:lessonId` với 3 stage bắt buộc theo thứ tự **vocab → dialogue → exercises**.

### 4.1 Data model — 3-flag completion

`UserProgress` thêm 3 cột `DateTime?`: `vocabCompletedAt`, `dialogueCompletedAt`, `exercisesCompletedAt` (migration `20260925042159_add_activity_completion`, chỉ `ADD COLUMN` — không backfill).

- Ghi flag: `userProgress.upsert` theo `(userId, lessonId)`, set `now()` vào field tương ứng. Flag **sticky** (không bao giờ bị xóa), nhưng gọi lại cùng activity sẽ **ghi đè timestamp** — không phải set-once.
- `isCompleted` là cột persisted (không drop). `completeActivity` set `isCompleted = true, completedAt = now` khi đủ 3 flag (chỉ khi trước đó false); response trả `allDone || column`.
- Row hoàn thành theo luồng cũ (`POST /daily-session/complete`) có `isCompleted = true` nhưng 3 flag **null** — UI coi là đã xong để hiện banner hoàn thành thay vì mở lại từ stage đầu.
- Reload đọc lại flag qua `GET /lesson-status` (chỉ trả `column`, không suy diễn).

### 4.2 API (`daily-session/daily-session.controller.ts`)

| Route | Input | Output | Ý nghĩa |
|---|---|---|---|
| `POST /daily-session/activity-complete` | body `{ lessonId: string, activity: 'vocab'\|'dialogue'\|'exercises' }` (`CompleteActivityDto`, `@IsIn`) | `LessonProgressDto` | Đánh dấu 1 stage xong, trả về 3 flag mới |
| `GET /daily-session/lesson-status?lessonId=` | query `lessonId` | `LessonProgressDto` | Đọc 3 flag — khôi phục checkmark + nhảy tới stage chưa xong khi reload |

`LessonProgressDto = { lessonId, vocabCompletedAt: string\|null, dialogueCompletedAt: string\|null, exercisesCompletedAt: string\|null, isCompleted: boolean }`.

Cả 2 route JWT-guarded (controller-level `JwtAuthGuard`), dùng throttle mặc định — **không** `@SkipThrottle`.

### 4.3 Admin bypass — `common/admin.ts`

`isAdminEmail(email)` — source-of-truth duy nhất cho whitelist admin (env `ADMIN_EMAILS`, phân tách bằng dấu phẩy, so khớp case-insensitive). Email trong whitelist bỏ qua khóa tuần tự ở server (`vocabulary.service`) và ẩn lock trên UI. Frontend nhận `isAdmin` qua `GET /users/me` (`user-response.dto.ts`); wired through `auth.service`, `users.service`, `vocabulary.service`.

### 4.4 Frontend wizard (`pages/lessons/`)

- `lesson-learn-page.tsx` — route `/learn/:lessonId`; seed checkmark từ `GET /lesson-status`, stepper chọn tự do 3 stage (không khóa tuần tự); đủ 3 → banner hoàn thành + nút bài kế (`GET /daily-session/current-lesson`).
- `vocab-stage.tsx` — flashcard bắt buộc chạy hết rồi mới tới quiz.
- Stage dialogue — dùng lại `DialogueReader`; **chỉ pass shadowing ("trôi") mới mark complete**. Chưa trôi vẫn ghi SRS (`POST /dialogue-review`) để lên lịch ôn lại nhưng không mở khóa.
- `exercises-stage.tsx` — câu checkable (có nút "Kiểm tra") phải được check hết; exercise view-only (drill / stroke order) tính done ngay khi render. Rule tách thành pure helper `completion-detection.ts` → `isExercisesStageComplete()` (unit-test được, không phụ thuộc React/i18n).
- `legacy-lesson-redirect.tsx` — `/lessons/:order` + `/lessons/:order/exercises` → `/learn/:id`; param nhận cả order (số) lẫn CUID qua `useResolveLessonId`.

`pages/lessons/lesson-detail-page.tsx` và `lesson-exercises-page.tsx` **không còn route** (orphaned) — giữ file, không dùng.

## Unresolved questions

- Import prod (phase 5) chưa chạy — cần kiểm tra volume mount cho `storage/exercise-*` trên VPS trước khi import.
- `lesson-detail-page.tsx` / `lesson-exercises-page.tsx` orphaned — chờ xác nhận xóa hẳn (không còn reference nào trong `src/`).
