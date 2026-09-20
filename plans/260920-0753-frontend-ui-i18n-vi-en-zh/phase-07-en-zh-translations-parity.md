---
phase: 7
title: EN ZH Translations Parity
status: completed
priority: P1
effort: 5h
dependencies:
  - '2'
  - '3'
  - '4'
  - '5'
  - '6'
---

# Phase 7: EN ZH Translations Parity

## Overview

Dịch full `en.json` + `zh.json`, kiểm tra parity key 3 locale, quét sót string hardcode, dọn text lẫn tiếng Anh, verify cuối.

## Requirements

- Functional: chuyển VI→EN→ZH ở Header, toàn UI đổi theo, không còn key raw hiển thị
- Non-functional: zh dùng thuật ngữ học tiếng Trung chuẩn (生词, 复习, 对话, 拼音...) không dịch word-by-word

## Architecture

- Nguồn: `vi.json` hoàn thiện sau phase 2-6 (~500 key × 3 cấp domain)
- Dịch EN từ vi (người kiểm tra là user — VI/EN song ngữ), ZH dùng thuật ngữ HSK chuẩn
- Parity check: script nhỏ `frontend/scripts/check-i18n-parity.mjs` — so bộ key phẳng (flatten) 3 JSON, exit 1 nếu lệch; chạy bằng `node frontend/scripts/check-i18n-parity.mjs`
- Quét sót: `grep -rnP '[\x{00C0}-\x{017F}]' frontend/src --include='*.tsx'` → chỉ được match trong comment/tên riêng; không còn string JSX

## Related Code Files

- Modify: `frontend/src/i18n/locales/en.json`, `frontend/src/i18n/locales/zh.json` (điền full)
- Create: `frontend/scripts/check-i18n-parity.mjs`
- Modify: sót string hardcode phát hiện khi quét (nếu có)

## Implementation Steps

1. Viết `check-i18n-parity.mjs` (flatten key → so vi/en/zh, in key thiếu/thừa từng locale)
2. Dịch `en.json` full — câu tự nhiên, interpolation giữ nguyên `{var}`, plural `en` cần `_one`/`_other`
3. Dịch `zh.json` full — thuật ngữ: Từ vựng→生词, Ôn tập→复习, Hội thoại→对话, Phiên âm→拼音, Chuỗi ngày học→连续打卡 (hoặc tương đương tự nhiên)
4. Chạy parity check → sửa lệch
5. Grep quét sót string có dấu tiếng Việt trong `.tsx` — xử lý các match còn lại
6. Verify thủ công end-to-end: đổi 3 ngôn ngữ, đi qua mọi page (login → dashboard → hsk → lesson → today full session → vocabulary → profile → import), refresh giữa chừng
7. Build production `npm run build` pass
8. Cập nhật docs (`docs/deployment-guide.md` nếu cần note về locale) + changelog

## Success Criteria

- [ ] Parity check exit 0 — 3 JSON cùng bộ key
- [ ] Grep không còn dấu tiếng Việt hardcode trong JSX (ngoài vi.json + dữ liệu DB)
- [ ] E2E thủ công 3 ngôn ngữ × mọi page pass
- [ ] Build prod pass

## Risk Assessment

- Chất lượng dịch zh/en phụ thuộc người review (user) — chấp nhận draft tốt, user chỉnh sau; key structure ổn nên chỉnh translation không đụng code
- Plural en/zh khác vi — kiểm tra chỗ dùng plural (phase 4 đánh dấu)

## Security Considerations

- Dịch không đổi ý nghĩa message lỗi bảo mật (không tiết lộ chi tiết hơn bản gốc)
