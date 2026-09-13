# SOP: Trích xuất PDF giáo trình HSK2 → JSON v2

**Ai đọc file này:** dev tiếp nhận công việc trích xuất nội dung. Toàn bộ quy trình được rút ra từ session 07/09/2026.

## Thực trạng nguồn

| File | Trang | Định dạng |
|------|-------|-----------|
| `content-source/pdf/HSK 2 Sách giáo khoa.pdf` | 145 | **Scan ảnh, KHÔNG có text layer** (pdftotext = 0 byte) |
| `content-source/pdf/HSK 2 Sách bài tập.pdf` | 169 | Scan ảnh, chưa xử lý (nguồn dự phòng) |
| `hsk_data/hsk2.csv` | 148 từ | Text chuẩn dấu thanh — đối chiếu chéo, THIẾU so với chuẩn ~300 từ |

Sách: HSK标准教程2 (BLCUP, bản VN Nhân Trí Việt 2020). Chỉ trích 生词 + 课文, bỏ 练习/注释 (bài tập sinh tự động trong app).

## Công cụ đã cài / có sẵn

- `pip install pymupdf` (Python 3.9 hệ thống) — render trang PDF → PNG
- `pdftotext` (Git mingw64) — chỉ dùng để kiểm tra text layer
- Vision: MCP tool `mcp__4_5v_mcp__analyze_image` (imageSource = URL)
- `pdfinfo`/`pdftoppm` KHÔNG có — dùng pymupdf thay thế

## Quy trình chuẩn (đã test ở Bài 1)

1. **Render:** `python -c "import fitz; doc=fitz.open('pdf/HSK 2 Sách giáo khoa.pdf'); [doc[i].get_pixmap(dpi=100).save(f'render/tb_p{i+1:03d}.png') for i in range(A,B)]"` — dpi=100 đủ đọc, đỡ nặng
2. **Read PNG → lấy URL:** Read tool KHÔNG hiện ảnh trực tiếp — nó upload CDN và trả URL trong kết quả. **Phải dùng đúng URL vừa trả về** cho `analyze_image`. Tuyệt đối không tự chế URL (signature theo từng file, sai → lỗi 1210)
3. **Analyze prompt ngắn (≤2 câu):** "State page type + which lesson + section, one line" để dò trang; prompt trích: "Transcribe EXACTLY, compact: (1) 生词 rows 'hanzi | pinyin | Vietnamese'. (2) 课文 lines 'speaker: hanzi / pinyin / Vietnamese'. Preserve tone marks. Verbatim only."
4. **Luật verbatim:** chép nguyên bảng in, KHÔNG lọc/phán đoán. Từ nghi ngờ (xuất hiện trong ví dụ nhưng không chắc thuộc bảng 生词) → thêm `"suspect": true`
5. **Xuất 1 bài/1 file:** `content-source/extracted/lesson-NN.json`, schema:
```json
{"lesson": {"title": "第二课 · <hanzi>", "order": 2, "source_pages": {"pdf": [start, end]},
  "vocabulary": [{"hanzi","pinyin","vietnamese","is_keyword":bool,"suspect":bool?}],
  "conversations": [{"order":1,"speaker":"妈妈","hanzi","pinyin","vietnamese"}]}}
```
6. **is_keyword:** 6-8 danh từ/động từ trung tâm của bài (policy đã duyệt ở mẫu Bài 1)

## Thông số đã xác minh

- **Offset trang:** PDF page 12 = trang in 1 = Bài 1 (offset +11)
- **Bản đồ trang (cập nhật dần):** L1 = 12-13 · L2 = 15-16 · **L4 = 40-43** (就买红色的吧) · L7 tập练习 tại 63 · L9 tập tại 67 · **L10 = 68** (我的祖国（二）) — nhịp bài KHÔNG ĐỀU, probe window phải giãn ±5 trang và skip trang của bài khác
- **Bài 1 我上厨房:** 10 câu hội thoại, 22 từ (2 từ suspect: 鸡蛋, 上车)
- **Bài 4:** 18 từ, 19 câu thoại (2 hội thoại 课文一/二), pypinyin 0 mismatch; lưu ý Vision hallucinate khi stitch bảng → max-zoom dpi 400-500 crop hẹp cho ô bảng khó
- Front matter PDF 1-11: lời tựa + giới thiệu + bảng từ tổng hợp (bỏ qua)
- Mục lục KHÔNG có trong bản scan → biên từng bài phải dò (probe 1-line prompt)
- **Concurrency:** tối đa ~4-6 agent song song — 12 agent gây rate-limit vision API (bài 8 bị)
- **Rate-limit handling cho agent:** foreground `sleep` bị CHẶN trong environment → agent không thể chờ nội bộ; quy tắc đúng: retry NGAY (khoảng cách giữa các lượt resume đã là cooldown tự nhiên), nếu vẫn fail → skip band, ghi gap vào report, làm tiếp phần còn lại. KHÔNG kết thúc lượt để chờ
- **False positive cross-check pypinyin đã biết (không phải lỗi):** erhua 快点儿 kuài diǎnr vs pypinyin "kuài diǎn ér"; thanh nhẹ 时候 shíhou vs "shí hòu"; biến âm bú/bù; từ ghép viết liền — tầng "convention" của script lọc hết
- **Importer upsert-only:** bỏ 1 từ khỏi file đã import KHÔNG tự xoá khỏi DB — phải báo session 01 xoá tay. Tránh bằng cách verify xong hết mới publish wrap file (01 check mtime trước khi import)
- **File per-lesson có 2 variant shape:** vocab/conversations trong "lesson" HOẶC top-level siblings — merge script đã chuẩn hoá cả 2 (bug skeleton đã fix 07/09); skeleton guard in WARN khi thiếu cả 2

## Bước MERGE (bắt buộc trước khi import)

File per-lesson ≠ schema import v2. Sau khi trích xong 20 bài, gộp:
```json
{"course": {"name": "HSK标准教程2 · Giáo trình chuẩn HSK 2", "type": "HSK", "level": 2, ...},
 "lessons": [ <20 lesson objects theo đúng schema v2 phase-02> ]}
```
→ `content-source/extracted/hsk2-textbook.json` (merge bằng script python nhỏ, không tay)
Sau đó đối chiếu pinyin chéo bằng pypinyin (sinh từ hanzi → diff) + user spot-check → import bằng `npm run import:textbook -- <file>` (Phase 2).

## Đã học được (đừng lặp lại)

- Preface pages 2-7: đừng trích full-text (tốn ~500K token oan) — prompt 1 dòng để dò loại trang
- Đừng đoán URL CDN — luôn lấy từ kết quả Read mới nhất
- **dpi 100 KHÔNG đủ cho bảng 生词** (test Bài 2: 2 lượt đọc cho kết quả mâu thuẫn). Chuẩn: crop theo dải ngang (band) dpi 220, prompt chỉ yêu cầu transcribe bảng. Dò loại trang thì dpi 100 + prompt 1 dòng là đủ
- **Bài 2 bắt đầu PDF page 15** (không phải 18) → nhịp bài ~3-4 trang PDF phần 生词+课文. Bài 2: 第二课 出门的时候，天气很好 (23 từ, 10 câu, speakers 大卫/玛丽)
- Batch workflow (wave 1 = bài 3-6, 07/09): mỗi agent 1 bài, probe window ±4 trang quanh dự đoán (nhịp ~6 trang/bài tính cả 练习), band-crop dpi 220, cross-check pypinyin (đã cài, lazy_pinyin Style.TONE, polyphone false-positive OK — report only), prompt batch phải có "DO NOT STOP until file written"
- Subagent CÓ tool vision (đã kiểm chứng Bài 2) nhưng có xu hướng dừng giữa chừng khi kết quả mâu thuẫn → SendMessage resume với chỉ dẫn cụ thể; batch cần ghi rõ "do not stop until file written"
- Fallback nếu agent fail: trích tuần tự tại phiên chính
