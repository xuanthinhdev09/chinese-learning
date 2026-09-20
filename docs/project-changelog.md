# Changelog

Ghi nhận các thay đổi đáng kể của dự án. Mục mới nhất ở trên cùng.

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
