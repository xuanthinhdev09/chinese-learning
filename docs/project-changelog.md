# Changelog

Ghi nhận các thay đổi đáng kể của dự án. Mục mới nhất ở trên cùng.

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
