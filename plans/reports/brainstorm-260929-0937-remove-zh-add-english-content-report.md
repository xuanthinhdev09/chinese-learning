---
type: brainstorm-report
date: 2026-09-29
topic: remove-zh-add-english-content
status: approved
next: ck-plan
---

# Brainstorm: Bỏ ngôn ngữ `zh` + bổ sung English cho nội dung (từ vựng + bài tập)

- **Date:** 29/09/2026
- **Status:** APPROVED — chờ `/ck:plan`
- **Scope:** Frontend (i18n + renderers) + Backend (1 migration, DTO) + content-source (script dịch AI, ngoài repo)

## 1. Vấn đề & Yêu cầu

1. UI đang có 3 ngôn ngữ `vi/en/zh`. `zh` thừa (app dạy tiếng Trung, giao diện tiếng Trung vô nghĩa) → bỏ.
2. Khi chọn English, nội dung học vẫn hiện tiếng Việt:
   - **Từ vựng** (`Vocabulary.meaning`): thuần tiếng Việt — đang hiển thị trong flashcard + quiz "chọn nghĩa". Có lỗi chất lượng: watermark OCR (`www.nhantriviet.com/...`), nghĩa sai (可能→"năm ngoái"), 53/171 từ trống nghĩa.
   - **Bài tập** (`Exercise.payload[].vi`): gloss tiếng Việt ~870 mục, hiện KHÔNG được render (renderer "Vietnamese-free").

### Quyết định user chốt (29/09)

| Hạng mục | Quyết định |
|---|---|
| Phạm vi English | Từ vựng + bài tập (cả hai) |
| Cách dịch | AI dịch hàng loạt (Gemini) + review |
| Chất lượng dữ liệu | Sửa cả Việt lẫn English (dọn nghĩa sai/trống) |
| Hiển thị gloss bài tập | Có, hiển thị song ngữ vi/en |
| Cách review bản dịch | Qua file (không build UI admin mới) |

## 2. Bối cảnh khảo sát (facts)

- **UI i18n**: `frontend/src/i18n/` vi/en/zh. Điểm chạm `zh`: `i18n/index.ts` (type + `UI_LANGUAGES` + `isUiLanguage` + `resources`), `exercise-card.tsx:96` (`startsWith('zh')`). **KHÔNG** đụng `use-chinese-tts.ts:39` (`'zh'` = chọn giọng TTS, khác UI).
- **Từ vựng**: `Vocabulary.meaning String` — dữ liệu 171 từ: 117 nghĩa Việt thuần, 53 trống, 1 có `|`. Comment "english | vietnamese" là SAI so với dữ liệu thực. Có `content-source/meaning-fix-audit.json` (book_extracted vs model_knowledge) = kết quả dọn nghĩa Việt từng làm dở.
- **Bài tập**: `Exercise.instructionVi` (cột) — thực chất đã chết vì instruction i18n đủ 12/12 typeCode qua `exercises.instr.*`. Gloss `vi` nằm TRONG payload JSON (cột `Json`) → importer lưu nguyên payload, validator không reject field lạ.
- **Hạ tầng hiển thị sẵn có**: `language-preference-store` (vietnamese/english/both) + `getDisplayMeaning()` — chỉ thiếu dữ liệu English.
- **Lịch sử**: `zh` từng được cố ý thêm ở plan `260920-0753-frontend-ui-i18n-vi-en-zh` (quyết định cũ), giờ user đảo ngược.

## 3. Phương án đã đánh giá

### 3.1 Lưu trữ English cho từ vựng
| Phương án | Ưu | Nhược | Kết |
|---|---|---|---|
| Dùng lại `meaning` "english \| vietnamese" | Không migration | Va chạm dấu `\|` trong data ("rẻ 4 \|"), format không đáng tin | Loại |
| **Thêm cột `meaningEn String?`** (giữ `meaning` = Việt) | Tường minh, không vỡ data cũ | 1 migration | ✅ Chọn |
| Bảng dịch sidecar riêng | Linh hoạt | Over-engineered (YAGNI) | Loại |

### 3.2 Lưu trữ English cho bài tập
| Phương án | Ưu | Nhược | Kết |
|---|---|---|---|
| **Thêm field `en` song song `vi` trong JSON nguồn → re-import** | Giữ JSON là source-of-truth, importer idempotent chảy `en` tự động, KHÔNG đổi schema/validator/importer | Phải sửa file JSON + re-import | ✅ Chọn |
| Enrich trực tiếp DB (bỏ qua JSON) | Nhanh | Re-import sau này xóa sạch `en`, vỡ nguyên tắc idempotent | Loại |
| Cột `instructionEn` riêng | — | Không cần: instruction đã i18n đủ 12 typeCode | Loại (YAGNI) |

### 3.3 Cách dịch + review (user chốt)
- **AI dịch hàng loạt** bằng Gemini (tái dùng tooling `content-source/tools/`).
- **Review qua file**: script xuất file song ngữ (từ gốc → Việt sửa → English) → user sửa file → script apply + import.

## 4. Thiết kế chốt

### 4.1 Phần 1 — Bỏ `zh` (nhỏ, độc lập)
1. `i18n/index.ts`: loại `zh` khỏi `UiLanguage`, `UI_LANGUAGES`, `isUiLanguage`, `resources`.
2. Xóa `frontend/src/i18n/locales/zh.json`.
3. `exercise-card.tsx:96-100`: bỏ nhánh `startsWith('zh')` — instruction luôn hiện bản dịch (fallback `instructionVi` giữ nguyên cho an toàn).
4. Người dùng lưu `zh` cũ trong localStorage → `isUiLanguage('zh')` = false → tự rơi về `vi`.
5. Không đụng `use-chinese-tts.ts`.

### 4.2 Phần 2 — Từ vựng song ngữ
1. Migration: `ALTER TABLE vocabularies ADD COLUMN meaning_en TEXT` (nullable).
2. Dọn nghĩa Việt: script + LLM điền 53 từ trống, sửa watermark/nghĩa sai (đối chiếu `meaning-fix-audit.json`).
3. Dịch `meaning → meaning_en` (LLM batch).
4. Backend: `vocabulary.service` + DTO trả thêm `meaningEn`.
5. Frontend: bỏ `parseMeaning` sai; `vietnamese = meaning`, `english = meaningEn`; `getDisplayMeaning()` đã sẵn sàng. Điểm hiển thị (vocabulary-card, flashcard, quiz, today) tự hưởng.

### 4.3 Phần 3 — Bài tập song ngữ
1. Script dịch `payload[].vi → en` (+ sửa `vi` hỏng) ghi field `en` vào `lesson-NN.json` (15 file).
2. Re-import (idempotent) — `en` chảy vào DB qua cột `Json` tự động.
3. Frontend: thêm `en` vào `ExerciseItem`/`ExerciseExample`/`OptionText` (types); renderers (`text-options-body`, `tf-judge-body`, `picture-pool-body`, `pinyin-pair-body`, `radical-groups-body`, `drill-and-stroke-order-bodies`) hiển thị gloss theo `language-preference`. Bỏ `DRILL_TYPE_LABELS` hardcode tiếng Việt → i18n key.

### 4.4 Luồng dịch AI (chung)
```
content-source (JSON hiện tại)
  → script Gemini: sinh English + sửa Việt
  → xuất file song ngữ (review)
  → user sửa file
  → script apply: ghi lại JSON nguồn / cập nhật DB
  → import (từ vựng + bài tập)
```

## 5. Rủi ro

- **~870 gloss + 171 nghĩa** — khối lượng dịch lớn nhưng cơ học; script batch + review file kiểm soát được.
- Gloss `vi` hỏng (OCR vỡ) lan sang English nếu dịch từ bản hỏng → phải dọn `vi` trước khi dịch (đã có quyết định sửa cả Việt).
- Renderer gloss: mỗi typeCode có shape khác nhau → thêm dòng nghĩa phải defensive (field optional), không phá layout hiện tại.
- Re-import bài tập: đảm bảo idempotent, không xóa ảnh/audio đã upload.
- `language-preference` hiện chỉ áp cho từ vựng → cần mở rộng dùng cho gloss bài tập, tránh trùng lặp logic (DRY).

## 6. Tiêu chí hoàn thành

- Chọn EN ở Header → UI không còn `ZH`, không còn string `zh` hardcode (trừ TTS voice).
- Từ vựng: flashcard/quiz hiện nghĩa English khi preference=english; nghĩa Việt đã dọn (hết watermark, đủ 171 nghĩa).
- Bài tập: gloss hiện song ngữ đúng preference; `DRILL_TYPE_LABELS` theo i18n.
- Re-import 15 lesson giữ nguyên ảnh/audio; `en` tồn tại sau re-import (idempotent).
- Build TS + Vite pass; test (nếu có) pass.

## 7. Next steps

1. `/ck:plan` (default) với context báo cáo này → plan theo 3 phần (bỏ zh → từ vựng → bài tập).
2. Implement từng phase, build pass từng phase.
3. Script dịch AI chạy ngoài repo (`content-source/tools/`) — tách khỏi plan code, chạy thủ công trước khi import.

## Câu hỏi chưa giải quyết

- Không có — mọi quyết định user đã chốt.
- (Ghi chú triển khai) Dữ liệu nghĩa Việt hiện tại trong DB có thể đã khác export `vocab-export-20260908.json` → trước khi dịch, script nên đọc từ DB (source-of-truth thật) thay vì export cũ.
