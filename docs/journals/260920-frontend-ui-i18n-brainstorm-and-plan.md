---
date: 2026-09-20
type: brainstorm-plan
topic: frontend-ui-i18n-vi-en-zh
---

# Brainstorm + Plan: i18n UI frontend VI/EN/ZH

## Context

UI toàn bộ đang hardcode tiếng Việt (lẫn vài string tiếng Anh). Muốn đa ngôn ngữ VI/EN/ZH trước khi mở rộng user. Backend không đổi — scope frontend only.

## What happened

Scout codebase: **0% i18n**, **37/54 file .tsx** chứa string hardcode, ước tính **~500 string**. Chưa từng có layer dịch nào — mọi text nằm thẳng trong JSX. Brainstorm chốt design (user duyệt), sau đó `/ck:plan` tách thành 7 phase. Điều đáng chú ý: scout phát hiện cả trang Import (cổng vào dữ liệu) cũng hardcode — dễ bị loại khỏi scope nếu không rà kỹ, nhưng đã quyết i18n luôn vì bỏ sót bây giờ là phải mở lại plan sau.

## Key decisions

| Quyết định | Lý do / trade-off |
|---|---|
| **react-i18next** (bỏ tự viết context, typesafe-i18n) | Tự viết ~60 dòng nghe hấp dẫn nhưng là viết lại i18next (interpolation, plural, tooling). typesafe-i18n type-safe hơn nhưng overkill cho MVP — YAGNI. Chi phí: +13KB gzip, thêm 2 dep |
| **3 locale: vi default + en + zh** | `vi.json` là nguồn gốc; fallback mọi key thiếu về `vi` nên UI không vỡ khi dịch dở |
| **Toggle VI/EN/ZH ở Header, persist localStorage** | Zustand persist, theo pattern `language-preference-store` có sẵn |
| **Luôn default `vi`, KHÔNG detect browser** | Người dùng VN là chính; detect browser gây "UI tự đổi ngôn ngữ" khó debug |
| **Map lỗi backend → key i18n ở frontend** (`translateApiError`) | Backend giữ nguyên message tiếng Anh — KISS. Bỏ phương án backend trả theo Accept-Language (phải sửa backend). Message lạ → trả nguyên `err.message`, không mất thông tin |
| **i18n cả trang Import** | Tránh nợ i18n phân nửa app |
| **Loại trừ: nội dung bài học DB + `language-preference-store`** | Dữ liệu học (từ vựng, hội thoại, lyrics) là data, không phải UI. `zh` ở đây là ngôn ngữ giao diện — không đụng nội dung học |

Quy ước quan trọng: interpolation bắt buộc `t(key, {var})` — cấm nối chuỗi text (sai trật tự từ EN/ZH).

## Impact

- Plan 7 phase, ước ~24h: `plans/260920-0753-frontend-ui-i18n-vi-en-zh/plan.md`
- Thứ tự: infra → layout/auth → dashboard/hsk → today (nặng nhất, ~44 string mỗi file reader) → vocabulary/profile → import → dịch full en/zh + parity check
- Rủi ro thừa nhận thẳng: **frontend chưa có test framework** — round này không có safety net tự động, chỉ có build pass + grep check + parity script

## Next

1. Implement qua `/ck:cook` theo plan, build pass từng phase
2. Sau phase 7: cân nhắc thêm key-parity check vào CI (out of scope hiện tại)

## Câu hỏi chưa giải quyết

- Không có — mọi quyết định đã user chốt.
