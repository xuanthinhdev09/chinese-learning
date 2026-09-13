# Brainstorm: "ĐƠN GIẢN — LẶP LẠI" — Daily Session + Content Pipeline

**Ngày:** 07/09/2026
**Phạm vi:** Toàn bộ pipeline (format nội dung → import → phiên học 1 nút)
**Trạng thái:** ✅ Đã chốt phương án 1 — chờ lập kế hoạch `/ck:plan`

---

## 1. Bài toán

Chủ dự án có giáo trình riêng (PDF) + triết lý học **"ĐƠN GIẢN — LẶP LẠI"**. Trọng tâm: **hội thoại + pinyin** (đọc theo từng câu), từ vựng chỉ phụ trợ. Hiện trạng app: menu-driven 3 bước mới học được 1 từ, model `Conversation` có sẵn trong DB nhưng chưa có UI, chưa có khái niệm khóa học ngoài HSK.

## 2. Yêu cầu đã chốt (Discovery)

| Hạng mục | Quyết định |
|----------|-----------|
| Nguồn nội dung | Giáo trình riêng (PDF), cấu trúc: từ vựng + hội thoại/bài |
| Bài tập | Sinh tự động từ từ vựng — KHÔNG số hoá bài tập sách |
| Luyện hội thoại | **Đọc theo từng câu** (shadowing: pinyin + hanzi + VN + TTS mẫu) |
| Vai trò từ vựng | Phụ trợ: 5–8 từ khóa/bài, flashcard + quiz nhanh, vào SM-2 |
| Pipeline PDF | PDF → AI xử lý offline thành JSON chuẩn → import qua wizard. App KHÔNG đọc PDF |
| UX | 1 nút "Học hôm nay" → hết phiên = xong nhiệm vụ |

## 3. Phương án đã đánh giá

1. **PA1 — Mở rộng tối thiểu** ⭐ CHỐT: generalize course model + `UserDialogueProgress` + JSON v2 + module `daily-session` mỏng + trang `/today`. DRY tối đa, tái dùng SM-2/TTS/wizard.
2. PA2 — Chỉ frontend ghép nối: loại — hội thoại không có lịch lặp, giáo trình riêng kẹt khung HSK.
3. PA3 — Engine session server-side đầy đủ: loại — over-engineering (YAGNI) cho app cá nhân.

## 4. Thiết kế cuối cùng (PA1)

### 4.1 Schema (migration nhỏ)
- `HskLevel` → model `Course` (giữ table `hsk_levels` qua `@@map`): thêm `type: String` (`HSK`/`CUSTOM`), bỏ unique đơn trên `level`
- Thêm `UserDialogueProgress`: `userId, lessonId, stage(0..4), lastReviewedAt, nextReviewAt` — lịch giãn cách hội thoại 1→3→7→14 ngày

### 4.2 Import JSON v2 (tôi fill từ PDF, user duyệt)
```json
{
  "course": { "name": "...", "type": "CUSTOM", "order": 1 },
  "lessons": [{
    "title": "Bài 1 ...", "order": 1,
    "vocabulary": [{ "hanzi": "...", "pinyin": "...", "vietnamese": "...", "is_keyword": true }],
    "conversations": [{ "order": 1, "hanzi": "...", "pinyin": "...", "vietnamese": "..." }]
  }]
}
```
- Import module: thêm validator/mapper cho `conversations` + `is_keyword`. Wizard UI không đổi.

### 4.3 Backend
- Module `daily-session` mỏng: `GET /daily-session` (kế hoạch hôm nay: hội thoại đến hạn, hội thoại mới = bài kế tiếp theo order, từ khóa bài, từ SM-2 đến hạn ≤15) + `POST /daily-session/complete` (streak, đánh giá hội thoại → schedule). Ghi tiến độ từ vựng tái dùng API SM-2 hiện có.

### 4.4 Phiên "Học hôm nay" (~10–15 phút, trang `/today`)
1. Ôn hội thoại cũ đến hạn — đọc nhanh 1 lượt
2. Hội thoại mới — đọc theo từng câu, TTS mẫu, nút nghe lại, tự đánh giá Trôi ✓ / Chưa trôi ↻ (chưa trôi → lặp)
3. Từ khóa bài (5–8) — flashcard → quiz chọn nghĩa
4. Ôn từ SM-2 đến hạn — flashcard (≤15)
5. Tổng kết — streak +1, "Xong nhiệm vụ hôm nay"

### 4.5 Touchpoints
- Backend: `prisma/schema.prisma`, `src/import/` (validators, mappers), mới `src/daily-session/`
- Frontend: mới `pages/today/`, nút trên `dashboard-page`, sidebar/nav; sửa nhẹ các trang HSK → "Khóa học"

## 5. Rủi ro

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Chất lượng TTS (Web Speech API) yếu cho shadowing | Test sớm; dự phòng: audio record thủ công (cột `audioUrl` đã có) |
| Pinyin dấu thanh sai khi trích PDF | Tôi trích + user spot-check trước khi import |
| Migration đổi model chạm frontend HSK pages | Giữ `@@map` table cũ, chỉ đổi model name + thêm cột |

## 6. Tiêu chí thành công

- Mở app → bắt đầu học trong **1 chạm**, không chọn gì thêm
- 1 phiên 10–15 phút, có điểm kết thúc rõ ("Xong hôm nay")
- Hội thoại được lặp lại theo lịch 1/3/7/14 không cần user cấu hình
- Giáo trình riêng lên app chỉ qua: PDF → JSON → wizard upload

## 7. Next steps

1. `/ck:plan` cho PA1 (migration → backend → frontend → test)
2. User gửi PDF giáo trình → tôi trích JSON v2
3. (Sau) nạp HSK2–6 qua cùng pipeline

## Câu hỏi chưa giải quyết

- TTS giọng đọc tiếng Trung trên máy/điện thoại của user — cần test thực tế trước khi lock bước shadowing
