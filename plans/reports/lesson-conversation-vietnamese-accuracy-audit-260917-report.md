# Audit + fix hội thoại HSK2 — extracted/import (đối chiếu sách gốc)

- Ngày: 17/09/2026. Phạm vi: nghĩa tiếng Việt khớp tiếng Trung trong `content-source/extracted/import/*.json`.
- Ground truth: `ocrspace_cache/page_*.txt` (raw OCR của bản in Nhan Tri Viet — nguồn gốc của pipeline import) + render PDF 110dpi.
- Trạng thái: **ĐÃ ÁP 99 thay đổi** vào 15 file import (backup: `extracted/import.bak-20260917/`, diff từng dòng: `extracted/import-fixes-change-log.json`). Script: `tools/fix_conversations_from_book.py`.
- Sau fix: 245/245 turn khớp cấu trúc sách, 0 junk, 0 dòng cắt cụt, 0 trùng lặp (script verify trong transcript).

## Nguyên nhân lỗi
Pipeline `extract_conversations.py` parse OCR theo cột A:/B: rồi align hanzi↔vi kiểu "greedy" theo speaker: OCR mất/dư dòng → trượt cả đoạn; các mảnh "Từ mới", giải thích ngữ pháp trong bảng từ vựng lọt sang cột vi.

## Đã sửa (tổng 99 thay đổi)

### 1. Dịch Việt cắt cụt → nối theo đúng bản in sách (35 dòng)
Ví dụ: L01#07 "Vậy buổi chiều chúng ta" → "...cùng đi đá bóng nhé."; L09#07 "tôi rất hoan" → "hoan nghênh."; L12#04 "tốt cho sức" → "sức khỏe mà."

### 2. Dịch lệch đoạn L06 → tái lập 2 đoạn hội thoại (xóa #09–11 cũ, thêm 8 turn)
- 06-3 在健身房: 打篮球/下雨/游泳/七十公斤 (4 turn, vi theo sách: "Chúng tôi không chơi vì hôm qua trời mưa. Nhưng tôi đi bơi." v.v.)
- 06-4 在办公室: 这两天怎么没看见小张 / 他去北京了 / 去北京了？是去旅游吗？/ 不是，听说是去看他姐姐.

### 3. Turn bị bỏ sót hoàn toàn → thêm 11 turn
- L07 +1: 今天晚上我们一起吃饭吧，给你过生日。(vi của nó trước đây dính nhầm vào dòng #12)
- L08 +8: nguyên 2 đoạn 08-3 (khách sạn, phòng 317) + 08-4 (cửa hàng, mua đầm)
- L13 +1: 不远，走路二十分钟就到。
- L15 tách #07 thành 2 turn B + C (书 có 3 speaker: A/B/C)

### 4. Rác trong bản dịch → xóa (10 dòng)
`| Từ mới |` (L03#12,16; L08#04,08), "cho rằng, cũng" (L01#04), giải thích ngữ pháp 一下 (L03#08), "mừng sinh nhật bạn đó" (L07#12), "anh trai" (L10#13), "có thể, có lẽ" (L11#16), "số không" (L12#12), "C:" (L15#07)

### 5. Hanzi lỗi → sửa theo sách (13 dòng)
- Thiếu số: L07#03 `已经9点多了` · L04#14 `我是2011年来的` · L11#08 `25岁` · L11#15 `…她姓王，28岁。` · L15#01 `今天是12月20日` · L12#10 `有零下10度吧？` (số lấy theo nguyên bản in: chữ Ả Rập trong sách giữ nguyên, pinyin đọc theo âm Hán: shí'èr yuè èrshí rì…)
- Nhiễm tựa đề bài: L01#18, L02#14, L10#18, L11#16, L12#16, L13#12, L14#16, L15#15 → bỏ đuôi
- Dup câu: L04#16; OCR dup 东西: L14#14; thiếu đuôi list: L10#12 `羊肉、鸡蛋、面条、西瓜……真不少！妈妈呢？`

### 6. Câu không có trong 课文 → xóa (1 dòng)
L14#17 但是太贵了我没钱买 (sách 14-4 chỉ có 4 turn)

## Đính chính so với bản report nháp đầu
- L15#01: sách in **12月20日** (ngày 20/12) — bản dịch cũ "20 tháng 12" **đúng**; lỗi chỉ là hanzi mất số. (Lần đọc vision "24/12" là sai.)
- L06 đoạn 4 là hội thoại văn phòng 4 turn (nhìn thấy từ OCR cache); các lần transcribe vision từ ảnh render cho 3 kết quả khác nhau — bỏ, lấy OCR cache làm chuẩn.

## Đợt sửa 2: chuẩn hóa dấu câu hanzi (cùng ngày, sau review của user)

User phát hiện `吃药了吗现在身体怎么样` thiếu dấu ？. Quét toàn bộ: **84/245 turn hỏi thiếu ？, 91/245 turn thiếu dấu câu cuối** (mất cả ，trong câu) — lỗi hệ thống của pipeline cũ, vi thì vẫn đúng dấu.

- Script: `tools/normalize_conversation_punctuation_from_book.py` — so khớp từng turn (bỏ dấu câu) với OCR cache theo trình tự → lấy lại text có dấu chuẩn sách (fullwidth ，？！), pinyin bỏ hẳn dấu câu cho đồng nhất.
- Kết quả: **241/245 turn đã gắn dấu chuẩn sách**; 4 dòng giữ nguyên vì text đã đúng sẵn từ đợt 1 (L04#14, L10#12, L11#15 — wrap số, L14#14 — cache có OCR dup "东西" không có thật); L08#11 "317." giữ dấu chấm halfwidth theo nguyên bản in (số phòng).
- Sau đợt 2: 0 turn thiếu ？, 0 turn thiếu dấu cuối, 0 pinyin chứa số/dấu.
- Diff đợt 2: `extracted/import-punctuation-change-log.json`. Backup `import.bak-20260917` vẫn rollback được cả 2 đợt.

## Đợt 3: import xuống DB live (17/09/2026, sau khi user review xong)

- Gộp 15 file import → `content-source/extracted/import/hsk2-textbook-v2-fixed.json` (15 lessons / 245 conversations / 171 vocab).
- Import bằng `npm run import:textbook` (TextbookV2Importer, cùng code path wizard upload) với `DATABASE_URL` override qua SSH tunnel 5433 → **DB live trên VPS** (không phải dev DB 5432).
- Kết quả: 0 lesson tạo mới (15 existing), 171 vocab updated, 245 conversation lines replaced. 2 warning pinyin không dấu (吧 ba / 着 zhe — thanh nhẹ, đúng chuẩn, không phải lỗi).
- Verify trên live DB: 230 → **245 conversations**; spot-check L02#05 `吃药了吗？现在身体怎么样？` và L06 16 turn đúng nội dung mới.
- An toàn: UserDialogueProgress reference lesson-level (không per-line) → replace conversations không mất progress người dùng.

## Unresolved questions
1. Pinyin của turn mới/thay hanzi được sinh lại bằng pypinyin (đúng convention pipeline); 6 dòng có số lấy pinyin chuẩn sách thủ công. Nếu muốn 100% khớp sách có thể rà lại.
2. `extracted-v2/` (bản merge cũ) vẫn chứa nội dung lỗi — có cần regenerate lại từ import đã sửa không?
3. Sau khi review xong: import xuống DB theo đúng pipeline cũ hay cần script riêng?
