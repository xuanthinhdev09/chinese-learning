---
type: brainstorm-report
date: 2026-09-20
topic: frontend-ui-i18n-vi-en-zh
status: approved
next: ck-plan
---

# Brainstorm: i18n UI toàn bộ frontend (VI/EN/ZH)

- **Date:** 20/09/2026
- **Status:** APPROVED — chờ `/ck:plan`
- **Scope:** Frontend only. Backend không đổi.

## 1. Vấn đề & Yêu cầu

UI hardcode tiếng Việt (lẫn lộn vài string tiếng Anh) rải khắp **37/54 file .tsx**, ước tính ~500 string. Cần i18n đầy đủ cho mọi text giao diện, **loại trừ nội dung bài học** (từ vựng, hội thoại, lyrics, tên lesson — dữ liệu DB).

### Yêu cầu chốt (user đã xác nhận)

| Hạng mục | Quyết định |
|---|---|
| Ngôn ngữ | 3: `vi` (default) + `en` + `zh` |
| Default lần đầu | Luôn `vi`, không detect browser |
| Thư viện | react-i18next + i18next |
| Switcher | Segmented VI/EN/ZH ở Header (desktop + mobile), persist localStorage |
| Lỗi backend | Map message tiếng Anh → key i18n ở frontend, không sửa backend |
| Trang Import | Có, i18n toàn bộ |

## 2. Phương án đã đánh giá

### Thư viện i18n
| Phương án | Ưu | Nhược | Kết |
|---|---|---|---|
| **react-i18next** | Chuẩn ngành; useTranslation, interpolation, plural built-in; typing key TS; ecosystem/tooling | +13KB gzip; thêm 2 dep | ✅ Chọn |
| Tự viết context | ~60 dòng, zero dep | Tự lo interpolation/plural; không tooling | Loại — lại viết lại i18next |
| typesafe-i18n | Type-safe nhất, codegen | Setup phức tạp, overkill cho MVP | Loại (YAGNI) |

### Lỗi backend
- ✅ **Map ở frontend** (chọn): backend giữ nguyên, KISS
- Gộp nhóm lỗi chung: mất chi tiết → loại
- Backend trả message theo Accept-Language: phải sửa backend, không cần → loại

## 3. Kiến trúc chốt

### Cấu trúc file mới
```
frontend/src/i18n/
├── index.ts                  # init i18next, fallback vi
└── locales/
    ├── vi.json               # nguồn gốc
    ├── en.json
    └── zh.json
frontend/src/stores/ui-language-store.ts   # zustand persist (pattern language-preference-store)
frontend/src/utils/translate-api-error.ts  # map message backend → key
```

- Init trong `main.tsx` trước render App.
- 1 namespace, JSON lồng 2 cấp theo feature domain: `common`, `nav`, `auth`, `dashboard`, `hsk`, `lesson`, `today`, `vocabulary`, `profile`, `import`, `errors`. Key dạng `today.dialogue.playAll`.
- Load all upfront (SPA 1 bundle, file nhỏ — không lazy load).
- Đổi ngôn ngữ: `i18n.changeLanguage()` + set `document.documentElement.lang`.
- Fallback key thiếu → `vi`; log warning khi dev.

### translateApiError(err, t)
- Map các message đã biết: `Invalid credentials`, `Username already taken`, `Invalid avatar selection`, `Current password is incorrect`, `Invalid refresh token`, `Refresh token expired` → `errors.*`.
- Không map được → trả `err.message` nguyên trạng (không mất thông tin).
- Áp dụng tại các điểm `setError(err.message)`: login, register, review-dashboard...

### Trích xuất theo nhóm (thứ tự plan)
1. Infra: cài dep, i18n config, ui-language-store, Header toggle, translateApiError
2. Layout (header, breadcrumbs, menu, protected-layout, empty-state, modal, common UI)
3. Auth (login, register)
4. Dashboard + HSK (list, detail, card)
5. Today (nặng nhất: dialogue-reader ~44 string, practice-runner, session-summary, lyrics-panel, group-select, speed-control, dialogue-controls)
6. Vocabulary (study, review-dashboard, vocabulary-list/card, flashcard, quiz ×2)
7. Profile (page, edit form, change-password, avatar picker, stats)
8. Import (page, password gate, upload zone, progress, validation-errors)
9. Dịch `en.json` + `zh.json` full pass + key-parity check + dọn text lẫn tiếng Anh về key

### Loại trừ rõ ràng
- `language-preference-store.ts` (VN/EN/both nghĩa từ vựng) — giữ nguyên
- Dữ liệu DB: lesson title, vocabulary, dialogue, lyrics
- `zh` trong UI là ngôn ngữ giao diện — không liên quan nội dung học

## 4. Rủi ro
- ~500 string × 3 ngôn ngữ — lớn nhưng cơ học; chia phase theo page
- Interpolation (số streak, % progress, tên user) phải `t(key, {var})`, cấm nối chuỗi
- Frontend **chưa có test framework** → không có test tự động round này

## 5. Tiêu chí hoàn thành
- Build TS + Vite pass
- Script check: 3 JSON cùng bộ key (parity vi/en/zh)
- Grep không còn string tiếng Việt/dấu tiếng Việt hardcode trong JSX ngoài `vi.json` (trừ nội dung bài học)
- Đổi ngôn ngữ ở Header cập nhật ngay toàn UI, refresh giữ nguyên lựa chọn
- Lỗi backend sai mật khẩu hiện đúng ngôn ngữ đã chọn

## 6. Next steps
1. `/ck:plan` với context báo cáo này → plan theo 9 phase trên
2. Implement từng phase, build pass từng phase
3. Sau cùng: cân nhắc thêm test key-parity vào CI (out of scope round này)

## Câu hỏi chưa giải quyết
- Không có — mọi quyết định đã user chốt.
