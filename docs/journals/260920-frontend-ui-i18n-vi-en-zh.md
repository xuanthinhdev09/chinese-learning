---
date: 2026-09-20
type: implementation-complete
topic: frontend-ui-i18n-vi-en-zh
---

# i18n UI VI/EN/ZH: hoàn thành 7/7 phase

## Context

Tiếp theo entry brainstorm + plan cùng ngày. Plan `plans/260920-0753-frontend-ui-i18n-vi-en-zh` — 7 phase, executed qua `/ck:cook`, xong trọn vẹn 20/09/2026. Design user duyệt trước bằng AskUserQuestion: 3 ngôn ngữ, vi default, toggle ở Header, map lỗi backend ở frontend, gồm cả trang Import.

## What happened

Cài `react-i18next` (`src/i18n/index.ts`: `fallbackLng: vi`, persist localStorage key `ui-language` qua zustand `ui-language-store`, **không** detect browser). **347 keys × 3 locale files**, `vi.json` là source of truth. EN có plural `_one/_other`, ZH dùng thuật ngữ HSK (生词/复习/对话/拼音/连续打卡). 273 literal + 68 dynamic keys, sau review: **0 key thiếu, 0 lệch interpolation**. Build pass.

Phần mệt mỏi nhất: đổi string thành `t()` trải khắp ~40 file .tsx — công việc chính xác nhưng nhàm, dễ sót một literal trong góc khuất. Cảm giác "xong rồi chứ" chỉ đến khi parity script chạy sạch, không phải khi code trông ổn.

## Key decisions

| Quyết định | Lý do |
|---|---|
| Module-level string arrays → thêm field `labelKey/descKey/nameKey`, gọi `t()` lúc render | Nếu dịch sẵn và lưu string thì đổi ngôn ngữ giữa session bị lệch. Key rồi dịch tại render là cách duy nhất đúng |
| Lỗi backend giữ tiếng Anh; `translate-api-error.ts` map message quen thuộc → `errors.*` | KISS — không đụng backend. Message lạ trả nguyên văn, không mất thông tin. API guard throw ở frontend cũng dùng message tiếng Anh ngữ nghĩa rồi map y như vậy |
| `vi.json` giữ nguyên các string tiếng Anh có sẵn (Flashcards, Quiz Meaning, Again/Hard/Good/Easy...) | Đúng luật "giữ nguyên text user đang thấy hôm nay" — không âm thầm "dịch cho đẹp" |
| Hai check scripts riêng | `check-i18n-parity.mjs` (parity, normalize plural EN) + `scan-hardcoded-vietnamese.mjs` (strip comment, chỉ nhận charset tiếng Việt riêng để tránh false positive với pinyin) |

## Verification

- Code review: **PASS cả 5 acceptance criteria** (full scan 273 literal + 68 dynamic, 0 missing, 0 interpolation mismatch)
- Fix sau review: 2 fallback chưa map trong auth-store, plural `summary.completed` bên EN, gitignore file export credential dtsspay ở repo root (phát hiện tình cờ, may là kịp trước khi commit)
- `npm run build` pass

## Còn sót lại (cố ý)

- 6 orphan keys: `common.loading/error/back/confirm`, `auth.terms`, `auth.privacy` — giữ vì vô hại, xóa là phải mở lại parity
- Error string được snapshot lúc xảy ra lỗi (đổi ngôn ngữ sau đó thì lỗi hiện ngôn ngữ cũ) — cosmetic, chấp nhận
- `vi` giữ "HSK Levels" nguyên văn theo luật exact-current-text

## Next

1. **User E2E thủ công** 3 ngôn ngữ × toàn bộ trang (phase 7 step 6) — chưa ai làm, đây là mục còn thiếu duy nhất
2. Tune bản dịch sau khi user đọc và góp ý
3. Cân nhắc đưa parity check vào CI (defer từ lúc plan)

## Câu hỏi chưa giải quyết

- Không có blocker. Chờ kết quả E2E thủ công của user.
