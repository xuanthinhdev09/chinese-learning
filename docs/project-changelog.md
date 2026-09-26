# Changelog

Ghi nhận các thay đổi đáng kể của dự án. Mục mới nhất ở trên cùng.

## 2026-09-26 — Gamification hành vi: 3 đòn bẩy (soft default, khen chuỗi, streak freeze)

Tăng động lực học theo tâm lý học hành vi (đánh giá flow 7.5 → 8.5–9):

- **Soft default thay khóa cứng** — stepper 3 stage vẫn bấm tự do, nhưng bước chưa xong đầu tiên (thứ tự từ vựng → luyện nghe → bài tập) được gợi ý mờ bằng badge "Nên làm" + ring nhẹ (`StageStepper.recommendedIndex`, `learn.recommended`). Giữ autonomy, lấy lại scaffolding cho người mới.
- **Khen chuỗi đúng (variable reward)** — quiz từ vựng đếm chuỗi trả lời đúng liên tiếp; đạt mốc 3/5/10/20 hiện khen ngắn (`today.practice.praise3/5/10/20`), trả lời sai reset chuỗi. Áp chung cho cả quiz trong wizard lẫn ôn tập.
- **Streak freeze 1 ngày** — `spaced-repetition.calculateStreak`: 1 ngày lỡ giữa 2 ngày hoạt động được "đóng băng" (không reset streak); 2 ngày lỡ liên tiếp mới gãy. Ngày hôm nay luôn là "đang chờ". Giảm what-the-hell effect, giữ loss aversion mà không phạt quá nặng.

**Verify:** backend 105/105 tests pass; `tsc` frontend + backend sạch; i18n en khớp vi.

## 2026-09-25 — Luồng học thống nhất 3 giai đoạn (unified lesson wizard)

Thay luồng cũ `/today` (1 nút hoàn thành bài) bằng wizard 1 route với 3 stage bắt buộc theo thứ tự **vocab → dialogue → exercises**, mỗi stage tự nhận biết hoàn thành.

**Backend:**

- `UserProgress` thêm 3 cột nullable `vocabCompletedAt` / `dialogueCompletedAt` / `exercisesCompletedAt`; `isCompleted` set true khi đủ 3 flag (upsert per-activity, ghi đè timestamp nếu gọi lại). Migration `20260925042159_add_activity_completion` (chỉ `ADD COLUMN`, không backfill — row cũ giữ `isCompleted=true` với 3 flag null, UI coi như đã xong)
- Endpoint mới: `POST /daily-session/activity-complete` (body `{ lessonId, activity }`, `activity ∈ vocab|dialogue|exercises`) và `GET /daily-session/lesson-status?lessonId=` — khôi phục checkmark per-stage khi reload; cả 2 trả `LessonProgressDto`
- Admin check tách ra `backend/src/common/admin.ts` (`isAdminEmail`, env `ADMIN_EMAILS`) — source-of-truth duy nhất, wired through auth/users/vocabulary

**Frontend:**

- Route `/learn/:lessonId` — `lesson-learn-page.tsx`: stepper chọn tự do 3 stage (26/09 — bỏ khóa tuần tự), đủ 3 → banner hoàn thành + nút bài kế (`/daily-session/current-lesson`). Seed checkmark + nhảy tới stage chưa xong từ `GET /lesson-status`
- **Học lại bài cũ (26/09)** — banner hoàn thành thêm nút "Học lại" (`learn.reStudy`): tắt banner, vào lại 3 stage để ôn lại bài đã xong (flag server vẫn sticky, không reset tiến độ)
- Stage vocab (`vocab-stage.tsx`): flashcard bắt buộc chạy hết → quiz
- Stage dialogue: chỉ pass shadowing ("trôi") mới mark complete; chưa trôi vẫn ghi SRS để ôn lại nhưng không mở khóa
- Stage exercises (`exercises-stage.tsx`): câu checkable phải check hết, view-only (drill / stroke order) tính done khi render; rule tách thành pure helper `completion-detection.ts` (`isExercisesStageComplete`)
- Homepage = điểm vào duy nhất: hero "bắt đầu học" → dẫn thẳng `/hsk` (router học tự chọn) + mục ôn tập → `/vocabulary/review` (26/09 — bỏ chooser khuyến nghị/tự chọn vì 2 luồng cùng nội dung)
- **Bỏ 3 nút nav** ở header + mobile menu (Hôm nay / Trình độ HSK / Từ Vựng); header chỉ còn logo, language toggle, avatar dropdown; mobile menu chỉ còn hồ sơ + language toggle
- Legacy: `/lessons/:order` và `/lessons/:order/exercises` → redirect `/learn/:id` (`legacy-lesson-redirect.tsx`); `/today` giữ nhưng ẩn khỏi nav; root `/` → `/dashboard`
- Hook mới `use-resolve-hsk-level-id.ts` — `/hsk/:id` nhận số level hoặc CUID
- `lesson-detail-page.tsx` / `lesson-exercises-page.tsx` thành **orphaned** (không còn route, chưa xóa)

**Verify:** 105/105 backend tests pass; `tsc` + `npm run build` frontend pass.

## 2026-09-22 — Deploy: L2 live, mobile exercise UI, exercise media bền vững

- **Prod có L2**: sync DB (`exercises` + `exercise_images` 24 rows / 52 ảnh, pg_dump từ dev + remap lesson CUID dev→prod vì 2 DB seed riêng biệt) và file (52 ảnh + 4 audio `NN-1/2.mp3` — audio L2 02-1/02-2 mới). Prod: 24 exercises, 56 media files.
- **Exercise media không còn mất khi rebuild**: named volumes `exercise_images` / `exercise_audio` trong `docker-compose.prod.yml` (pattern `tts_cache`), Dockerfile pre-create dir own nodejs. Trước đây storage nằm trong container fs → `--build backend` là mất.
- **Frontend**: lesson URLs dùng order (`/lessons/2/exercises`) — `useResolveLessonId` vẫn nhận CUID cũ; `PicturePoolBody` mobile xếp chồng (câu trên, nút A-F 1 hàng dàn đều dưới), sm+ giữ inline. Fix UI 第16-20题 (看图片,选句子内容一致的图片) màn hình nhỏ.
- Tool: `backend/validate-lesson-json.ts` — validate workbook-json v3 độc lập (`npx tsx validate-lesson-json.ts <file>`).

## 2026-09-21 (tối) — Fix UI bài tập theo feedback L1

- Render block Ví dụ (payload.example) — `TfJudgeBody` (1-5, 26-30) + `PicturePoolBody`/`TextOptionsBody` (6-10, 16-20, 31-35); ảnh/đáp án ví dụ bị gạch đỏ + disable nút tương ứng (không áp cho per-item options 11-15 vì A/B/C lặp theo câu)
- Nội dung câu chỉ còn hán tự + pinyin (bỏ dòng tiếng Việt; `vi` vẫn giữ trong DB/JSON); thêm pinyin còn thiếu (example 11-15/31-35, 26-30 items + judgePinyin)
- Hướng dẫn phần chuyển hybrid i18n: hán tự từ DB, dòng dịch theo `exercises.instr.<typeCode>` (vi/en, zh ẩn); nhãn section i18n (`exercises.section.*`)
- Nút đáp án 11-15: pinyin trên chữ hán (grid 2 cột, A chung hàng chữ hán), flex-1 đều nhau
- 按偏旁归类 (1-2): redesign kho chữ chung + nhóm đang chọn; bấm chữ trong nhóm trả về kho; hint i18n
- Nav: thêm mục "Trình độ HSK" vào header desktop + mobile menu
- Data lesson-01: `example.answer` cho 6-10/16-20 (D, đối chiếu scan p08/p10), re-import qua CLI trong container

## 2026-09-21 — Bài tập Sách bài tập: pipeline v3 + UI làm bài tập

Nạp đề bài tập thật từ sách bài tập HSK2 (169 trang scan) vào DB và xây UI luyện bài tập trong app. Ảnh scan không crop tự động — user upload ảnh qua UI tại chỗ.

**Database (Prisma):**

- Model `Exercise` (lessonId, order, section 听力/阅读/语音/汉字, typeCode, instructionHanzi/Vi, payload Json) + `ExerciseImage` (filePath unique per lesson, exerciseId optional cho pool ảnh, cropBox nullable — bỏ không dùng)
- Migrations: `20260921042527_add_workbook_exercise_tables`, `20260921160000_add_exercise_image_file_path_unique`

**Backend `backend/src/exercises/` (ExercisesModule):**

- Endpoints: `GET /exercises/lesson/:lessonId`, `GET|POST /exercises/images/:imageId/file` (upload 5MB, khớp mime↔ext), `GET /exercises/audio/:filename`
- JWT guard toàn bộ — nội dung sách bản quyền BLCUP, **không serve public**; `@SkipThrottle` class-level (1 bài tải ~27 ảnh) nhưng upload re-enable 30 req/phút
- Storage port `ExerciseMediaStorage` (pattern TtsStorageService): env `EXERCISE_IMAGE_STORAGE_DIR` / `EXERCISE_AUDIO_STORAGE_DIR`; path safety bằng regex whitelist + resolve-in-root

**Import pipeline `backend/src/import/workbook/`:**

- `json-v3.validator.ts` — 12 typeCodes (TS const), 4 section; lỗi trả `errors[]`/`warnings[]`
- `workbook-v3.importer.ts` — idempotent: upsert theo `(lessonId, order)` và `(lessonId, filePath)`, xoá row stale, copy media best-effort (thiếu file → warning, không fail)
- CLI: `npm run import:workbook -- --file <lesson-NN.json>`; data frame v3 per-lesson tại `content-source/extracted-wb/`
- Frontend fetch media dạng blob qua react-query (`use-exercise-media.ts`) — img/audio không gửi được header Authorization

**Frontend:**

- Trang `/lessons/:lessonId/exercises` + nút "Luyện bài tập" ở lesson detail; 7 renderer dispatch 12 typeCodes (`components/exercises/`); upload ảnh inline tại image slot; i18n vi/en/zh

**Sửa theo code review (re-verify sạch):** `apiClient.postForm` thay post cũ (BLOCKER — FormData bị JSON.stringify); importer map `exerciseIdByOrder` thay vì dựa thứ tự mảng (MAJOR); object URL tạo trong `queryFn` tránh leak mỗi render (MAJOR)

**Trạng thái:** L1 đã import dev (12 đề / 27 slot ảnh chờ upload, re-import idempotent đã chứng minh); L2-15 chờ answer key user paste. **Verify:** 96/96 tests pass; plan `plans/260921-1015-workbook-exercise-scan-pipeline` (phase 4 Outcome).

## 2026-09-20 — i18n UI VI/EN/ZH (react-i18next)

Dịch toàn bộ chuỗi UI frontend sang 3 ngôn ngữ (VI/EN/ZH). Nội dung bài học trong DB (từ vựng, hội thoại, lyrics, tiêu đề bài) **không** nằm trong phạm vi i18n — theo thiết kế.

**Cơ chế:**

- `frontend/src/i18n/index.ts` — khởi tạo react-i18next; VI luôn là mặc định (không dò ngôn ngữ trình duyệt), fallback `vi`
- Locale files: `frontend/src/i18n/locales/{vi,en,zh}.json` — 347 keys mỗi file, nested 2 cấp theo domain: common, nav, auth, dashboard, hsk, lesson, today, vocabulary, profile, import, errors
- `vi.json` là nguồn chuẩn; en/zh phải khớp bộ keys — kiểm tra bằng `node scripts/check-i18n-parity.mjs` (chạy từ `frontend/`, exit 1 nếu lệch; en dùng suffix số nhiều `_one`/`_other` của i18next, script tự chuẩn hóa khi so sánh; zh dùng thuật ngữ HSK chuẩn: 生词/复习/对话/拼音)
- Đổi ngôn ngữ: toggle VI/EN/ZH ở Header (`frontend/src/components/layout/language-toggle/`), lưu localStorage key `ui-language`, chuyển tức thì không reload
- Lỗi API: backend giữ tiếng Anh; `frontend/src/utils/translate-api-error.ts` map các message tiếng Anh đã biết (từ backend và các guard throw ở `src/api/daily-session.ts`, `src/api/profile-api.ts`) sang keys `errors.*` lúc hiển thị; message chưa map hiển thị nguyên bản
- Guard chống chuỗi cứng tiếng Việt: `node scripts/scan-hardcoded-vietnamese.mjs` (chạy từ `frontend/`; bỏ qua nội dung tiếng Trung bài học và pinyin có dấu — ngoài phạm vi theo thiết kế)

**Cố tình loại khỏi i18n:** nội dung bài học từ DB, language-preference-store (VN/EN/both — mang nghĩa hiển thị nội dung, không phải ngôn ngữ UI), passphrase gate trang import.

**Verify:** `npm run build` trong `frontend/` pass (bundle 477.83 kB / gzip 144.19 kB). Plan: `plans/260920-0753-frontend-ui-i18n-vi-en-zh` (7 phases, hoàn tất).
