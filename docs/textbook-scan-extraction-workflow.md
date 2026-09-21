# Workflow: Scan sách giáo khoa → JSON v2 → Import DB

Tài liệu tổng hợp toàn bộ flow đã dùng để trích xuất bài học từ PDF sách giáo khoa (HSK标准教程2) vào DB.
Gộp từ SOP cũ `plans/260907-0949-daily-session-content-pipeline/research/pdf-extraction-workflow.md` (session 07/09/2026)
+ toàn bộ tooling trong `C:/My Work/chinese-learning/content-source/tools/`.

**Trạng thái:** HSK2 đã import đủ 15/15 bài (file cuối `extracted/import/hsk2-textbook-v2-fixed.json`).
Workflow tái sử dụng được cho sách mới (HSK3...).

---

## 1. Nguồn & vị trí file

| Đường dẫn (ngoài repo) | Nội dung |
|---|---|
| `C:/My Work/chinese-learning/content-source/pdf/HSK 2 Sách giáo khoa.pdf` | 145 trang, **scan ảnh, KHÔNG có text layer** (pdftotext = 0 byte) |
| `content-source/pdf/HSK 2 Sách bài tập.pdf` | 169 trang — nguồn dự phòng, chưa xử lý |
| `content-source/render/ocr_full/page_NNN.jpg` | ảnh render từng trang PDF (pymupdf) |
| `content-source/ocrspace_cache/page_NNN.txt` | raw text OCR.space theo trang — **ground truth deterministic** |
| `content-source/ocr_out/page_NNN.json` | JSON verbatim OCR bằng Gemini |
| `content-source/reference/toc-official-lessons.json` | mục lục chính thức: khung 15 bài + luật is_keyword |
| `content-source/extracted-v2/lesson-NN.json` + `conversations-lesson-NN.json` | dữ liệu per-lesson đã build |
| `content-source/extracted/import/lesson-NN.import.json` | file wrap schema v2, sẵn sàng import |
| `content-source/extracted/import/hsk2-textbook-v2-fixed.json` | **file merge cuối đã import** |
| `content-source/tools/*.py` | toàn bộ script pipeline (xem §4) |

Repo code liên quan: `backend/src/import/` (validator/mapper/importer/controller), CLI `backend/src/scripts/import-textbook-v2.ts` (`npm run import:textbook`).

## 2. Tổng quan pipeline (3 thế hệ — dùng thế hệ cuối)

1. **Thế hệ 1 (07/09): Vision thủ công theo bài.** Render trang → Claude Read PNG (nhận URL CDN) → `mcp__4_5v_mcp__analyze_image` transcribe từng bài. Công phu, tốn token, dễ hallucinate khi stitch bảng sinh词 → chỉ còn giá trị tham khảo (SOP cũ).
2. **Thế hệ 2: Gemini OCR full-book.** `gemini_ocr_driver.py` chạy batch 145 trang, prompt verbatim → `ocr_out/page_NNN.json`. Chết vì **quota free tier**: log `ocr_run.log` — 429 RESOURCE_EXHAUSTED dồn dập từ trang ~15, nhiều trang FAILED.
3. **Thế hệ 3 (cuối cùng, đã dùng để đóng HSK2): OCR.space (raw text) làm nền + mục lục chính thức làm khung + pypinyin sinh pinyin + model knowledge điền nghĩa + verify 4 lớp.** Không phụ thuộc LLM cho khung dữ liệu; LLM/model chỉ dùng để vá nghĩa và đối soát.

```
PDF → render (pymupdf)
      ├→ OCR.space Engine3 raw text (ocrspace_cache/)   ← nền deterministic
      └→ Gemini verbatim JSON (ocr_out/)                 ← đối soát, không phải khung
Mục lục sách (transcribe tay từ ocrspace_cache) → reference/toc-official-lessons.json
      → build_lessons_from_toc.py → extracted-v2/lesson-NN.json (vocab)
      → verify_toc_lessons.py + assemble_and_verify_lessons.py (4 lớp check)
      → fix_meanings_model_knowledge.py (nghĩa Việt primary = model knowledge)
      → extract_conversations.py (thoại A/B từ OCR raw) → conversations-lesson-NN.json
      → fix_conversations_from_book.py + normalize_conversation_punctuation_from_book.py
      → wrap_import_files.py → extracted/import/*.import.json + hsk2-textbook.json
      → npm run import:textbook -- <file>  (hoặc POST /import/upload/textbook-v2)
```

## 3. Thông số đã xác minh (sách HSK2)

- **Calibration trang:** `pdf_index = book_page - 1` (L2 opener book p.23 = pdf[22]); front matter PDF 1-11 bỏ qua; mục lục nằm ở ocrspace_cache `page_007/009/011.txt` (L1-5, L6-11, L12-15).
- **Nhịp bài KHÔNG đều:** khoảng trang mỗi bài khác nhau — tính trang bài theo TOC (`book_page` của bài kế), không chia đều.
- **Luật is_keyword:** từ đánh số KHÔNG sao (*) = trong đề cương 300 từ HSK2 → `true`; sao (*) = 超纲词 → `false`, field `beyond_syllabus: true`; biến thể trong ngoặc ghi chú.
- **Schema lesson v2 (file cuối):** `order, title, title_vi, book_page, source_pages, vocabulary[], conversations[]`.
  - vocab: `{hanzi, pinyin, vietnamese, is_keyword, beyond_syllabus, meaning_source}` (`meaning_source: "model-knowledge"`).
  - conversation: `{order, speaker "A"/"B", hanzi, pinyin, vietnamese, dialogue_order, dialogue_code "01-1", dialogue_title_hanzi, dialogue_title_vi}`.
- **Nghĩa Việt:** gloss in sách bị **misalign hàng** (lỗi scan bảng) → không đáng tin → dùng model knowledge làm primary (user đã duyệt), gloss sách chỉ để đối chiếu.
- **Pinyin:** sinh bằng pypinyin (`lazy_pinyin`, Style.TONE). False-positive đã biết, KHÔNG phải lỗi: erhua (快点儿 kuài diǎnr), thanh nhẹ (时候 shíhou), bú/bù, từ ghép viết liền, polyphone `{把了地得还干行长着都教少}` (list trong `merge_lessons_to_v2.py`).
- **Dấu câu thoại:** sách in `，。？！` fullwidth — normalize script khôi phục vào hanzi, pinyin bỏ dấu câu.

## 4. Kịch bản lệnh từng bước (tái sử dụng cho sách mới)

Mọi lệnh Python chạy trong `C:/My Work/chinese-learning/content-source/` (Python 3.9 hệ thống; cần `pymupdf`, `pypinyin`, `python-dotenv`, `google-genai`, `requests`).

```bash
# B0. Render toàn bộ PDF → ảnh (dpi đủ cho OCR; trang khó crop riêng dpi 400-500)
python -c "import fitz; doc=fitz.open('pdf/<sách>.pdf'); [doc[i].get_pixmap(dpi=150).save(f'render/ocr_full/page_{i:03d}.jpg') for i in range(len(doc))]"

# B1. OCR nền deterministic — OCR.space Engine 3 (idempotent theo cache; có rate-limit, chạy lại lần 2 nếu còn trang fail)
export OCRSPACE_API_KEY=...   # trong ~/.claude/skills/ai-multimodal/.env
python tools/ocrspace_batch_driver.py --pages 0-144
# → ocrspace_cache/page_NNN.txt ; log: ocrspace_run.log / ocrspace_run2.log

# B2. (tuỳ chọn, đối soát) Gemini verbatim JSON — CHỈ chạy được khi còn quota free tier
export GEMINI_API_KEY=...
python tools/gemini_ocr_driver.py --pages 0-144 --out ocr_out

# B3. Transcribe mục lục sách từ ocrspace_cache → reference/toc-official-lessons.json
#     (khung: book_page, title, vocab list + star/num; xuất phát từ B3 cũ nếu đã có)

# B4. Build vocab per-lesson: hanzi từ TOC, pinyin pypinyin, nghĩa Việt dò từ OCR trang bài
python tools/build_lessons_from_toc.py --out extracted-v2

# B5. Verify 4 lớp
python tools/verify_toc_lessons.py            # mọi từ TOC phải xuất hiện trong OCR trang bài
python tools/assemble_and_verify_lessons.py   # pypinyin 2-tier + diff model-knowledge + OCR presence

# B6. Nghĩa Việt primary = model knowledge (sửa bảng MEANINGS trong script trước khi chạy)
python tools/fix_meanings_model_knowledge.py  # → meaning-fix-audit.json

# B7. Thoại 课文: bắt turn A/B có CJK + align nghĩa Việt greedy
python tools/extract_conversations.py --out extracted-v2

# B8. Vá thoại theo ground truth sách (ops: set/insert_after/replace/delete trong script)
python tools/fix_conversations_from_book.py
python tools/normalize_conversation_punctuation_from_book.py   # khôi phục ，。？！

# B9. Wrap thành schema v2 import
python tools/wrap_import_files.py --src extracted-v2 --dst extracted/import
# → extracted/import/lesson-NN.import.json + hsk2-textbook.json (merge full, sorted)

# B10. Import vào DB (tunnel VPS 5433→5432 phải đang chạy — xem docs/vps-deploy-runbook.md)
cd ../chinese-learning/chinese-learning/backend
npm run import:textbook -- ../../content-source/extracted/import/hsk2-textbook.json
# hoặc upload UI wizard: POST /import/upload/textbook-v2
```

## 5. Hành vi importer (backend)

`TextbookV2Importer` — idempotent per file, mọi thao tác trong 1 transaction:
- Course resolve theo identity: `CUSTOM` theo name, `HSK` theo level (có rồi thì dùng, không thì tạo).
- Lesson resolve theo `(courseId, order)` — bài cũ giữ nguyên id.
- Vocab upsert theo `(lessonId, hanzi)` — re-import làm mới nội dung.
- Conversations **delete-all + replace** per lesson (an toàn: UserDialogueProgress là lesson-level, không mất).
- Validate bằng `JsonV2Validator` trước khi ghi; lỗi trả `errors[]` + `warnings[]`.

⚠️ **Upsert-only:** bỏ bớt 1 từ khỏi file rồi re-import KHÔNG tự xoá từ khỏi DB — phải xoá tay. → Verify xong hết mới publish file import.

## 6. Bài học kinh nghiệm (đừng lặp lại)

- **PDF là scan ảnh thuần** — mọi đường text-layer vô ích; luôn render ảnh trước.
- **dpi:** 100 đủ dò loại trang (prompt 1 dòng); bảng 生词 cần band-crop dpi 220; ô bảng khó dpi 400-500 crop hẹp. LLM vision hay hallucinate khi stitch bảng dài → bảng số liệu nên lấy từ OCR space/deterministic, không từ vision.
- **Gemini free tier 429 quay lại liên tục** khi batch 145 trang (log `ocr_run.log`: nhiều trang FAILED) — không dùng làm khung dữ liệu chính.
- **OCR.space** cũng fail rải rác (empty result ~88/145 ở run 1) nhưng idempotent theo cache → chạy lại run 2 là lấp đầy.
- **Đừng trích full-text preface/lời tựa** (tốn ~500K token oan) — chỉ cần dò loại trang.
- **Agent song song khi dùng vision:** tối đa 4-6; 12 agent gây rate-limit. Agent có xu hướng dừng giữa chừng khi kết quả mâu thuẫn → resume với chỉ dẫn "do not stop until file written".
- **Mục lục là nguồn khung tốt nhất** — dò trang theo probe từng bài là path cũ, đã bỏ.
- **Backup + change log** (`import-fixes-change-log.json`, `import-punctuation-change-log.json`) trước mỗi đợt vá file import — mọi sửa có audit trail.
- **Màu sắc dữ liệu:** hanzi từ mục lục sách (verbatim), pinyin từ pypinyin, nghĩa Việt từ model knowledge, thoại từ OCR raw + vá tay theo sách. Mỗi nguồn một tầng verify riêng.

## 7. Sách bài tập (Workbook) — JSON v3 → Exercise DB

Đã chạy pipeline cho sách Bài tập (session 21/09/2026), thiết kế khác giáo khoa ở chỗ: đề giữ verbatim per 题型 (12 typeCode), **không crop ảnh tự động** — user upload ảnh scan qua UI tại từng image slot; answer key user tự paste per bài.

| Đường dẫn | Nội dung |
|---|---|
| `content-source/pdf/HSK 2 Sách bài tập.pdf` | 169 trang scan — nguồn |
| `content-source/extracted-wb/lesson-NN.json` | data frame v3 per-lesson (đầu vào import) |
| `content-source/audio/hsk2/` + `audio-manifest.txt` | audio đề nghe gốc user cung cấp (`NN-1.mp3`/`NN-2.mp3`) |
| `backend/src/import/workbook/` | validator + importer v3 |
| `backend/src/import/cli/import-workbook-v3.cli.ts` | CLI import (`npm run import:workbook`) |

**Data frame v3 (per lesson):** `{lesson: {order, book_page}, exercises[], images[]}` — exercise có `order, section (听力/阅读/语音/汉字), typeCode, instructionHanzi?, instructionVi?, source_page?, payload`; image slot chỉ còn `{ref, page, file, desc}` — **không có cropBox** (cột DB giữ nullable nhưng không dùng). Payload tham chiếu ảnh qua `ref` và audio qua tên file `NN-N.mp3`.

**Luồng nạp 1 bài:**

1. Trích đề từ scan → `extracted-wb/lesson-NN.json`; answer key paste trực tiếp vào file (user làm)
2. Import: `cd backend && npm run import:workbook -- --file ../../content-source/extracted-wb/lesson-01.json` (tunnel VPS 5433→5432 đang chạy)
3. Upstream ảnh: mở trang `/lessons/:lessonId/exercises` trong app, upload scan tại từng slot (slot thiếu ảnh hiển thị trên UI)

**Idempotency:** upsert theo `(lessonId, order)` cho đề và `(lessonId, filePath)` cho ảnh; row không còn trong file bị xoá; thiếu file ảnh/audio trên disk chỉ là warning (`imagesMissingOnDisk`/`audioMissingOnDisk`) — re-import sau khi bổ sung là đủ. Media nằm trong `storage/exercise-images|exercise-audio` của backend, serve qua endpoint có JWT (bản quyền BLCUP, không public).

**Trạng thái:** L1 khép kín — 12 đề / 27 slot / 35 đáp án khớp key, import dev OK, re-import removed 0/0. L2-15 chờ answer key user; upload ảnh thật qua UI chưa làm.

## Unresolved questions

- Tools giáo khoa viết cứng theo HSK2 (số trang, TOC, MEANINGS) — sách mới cần fork tham số `--pages`, TOC reference, bảng meanings; chưa generic hoá (YAGNI, chỉ làm khi scan sách tiếp theo).
