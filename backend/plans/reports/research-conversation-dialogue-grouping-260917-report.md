# Research: tách nhóm hội thoại (dialogue grouping) cho dữ liệu sách HSK2

- Ngày: 17/09/2026. Yêu cầu: "dữ liệu scan hiện tại đang gộp nhiều hội thoại của 1 lesson thành 1 — nghiên cứu vấn đề này."
- Kết luận nhanh: đúng — sách chia mỗi bài thành **3-4 hội thoại độc lập** (mỗi đoạn có bối cảnh riêng: Ở trường, Trong bệnh viện…), nhưng import đang bẻ phẳng thành 1 mảng 15-18 dòng/bài, mất ranh giới + tên đoạn. **Khôi phục được 100%** từ dữ liệu scan đã có, không cần scan lại.

## 1. Hiện trạng

### Sách gốc (đã đối chiếu trong session này)
Mỗi lesson có 4 khối 课文 (riêng L09 đoạn 1 chỉ 3 turn), mỗi khối có: số đoạn, bối cảnh Hán (在学校), bối cảnh Việt (Ở trường), mã đoạn (01-1). Tổng toàn sách: **59 nhóm hội thoại / 245 turn**.

### Data model
`Conversation` (schema.prisma): `lessonId, order, speaker, hanzi, pinyin, vietnamese, audioUrl` — **không có khái niệm nhóm**. L06 #9-10 (trước khi sửa) từng lệch sang đoạn khác chính vì pipeline không biết ranh giới đoạn.

### Cách app đang dùng
- Backend `daily-session.service.ts`: serve `lines[]` phẳng theo lesson (`orderBy: order`) cho luyện shadowing; `UserDialogueProgress` track **stage theo lesson** (userId+lessonId), không theo dòng.
- Frontend `practice-runner.tsx`: render `lines` phẳng → UI không thể hiện "Đoạn 1: Ở trường".

### Nguyên nhân
`tools/extract_conversations.py` parse A:/B: theo toàn trang và filter bỏ dòng header (`HEADER = 课文|热身|注释…`) → thông tin nhóm bị vứt ngay từ khâu extract.

## 2. Dữ liệu nhóm khôi phục được (đã verify từng dòng trong session này)

Header đoạn nằm nguyên trong `ocrspace_cache/page_*.txt` (đơn dòng hoặc tách 3-4 dòng: số / 在学校 / Ở trường / 01-1). Bảng nhóm đầy đủ (số turn đã khớp 245/245):

| Lesson | Nhóm (code — bối cảnh) | Turn |
|--------|------------------------|------|
| L01 (18) | 01-1 在学校 Ở trường · 01-2 看照片 Xem ảnh · 01-3 在家里 Ở nhà · 01-4 在家里 Ở nhà | 4·4·4·6 |
| L02 (18) | 02-1 在运动场 Sân vận động · 02-2 在医院 Trong bệnh viện · 02-3 在操场 Ở sân thể thao · 02-4 在房间 Trong phòng | 4·4·6·4 |
| L03 (16) | 03-1 在房间 Trong phòng · 03-2 在家里 Ở nhà · 03-3 在家里 Ở nhà · 03-4 在办公室 Trong văn phòng | 4·4·4·4 |
| L04 (16) | 04-1 在教室 Trong lớp học · 04-2 在家里 Ở nhà · 04-3 在运动场 Sân vận động · 04-4 在公司 Trong công ty | 4·4·4·4 |
| L05 (16) | 05-1 在家里 Ở nhà · 05-2 在商店 Ở cửa hàng · 05-3 在教室 Trong lớp học · 05-4 在公司 Trong công ty | 4·4·4·4 |
| L06 (16) | 06-1 在学校 Ở trường · 06-2 在饭馆 Ở quán ăn · 06-3 在健身房 Ở phòng tập thể dục · 06-4 在办公室 Trong văn phòng | 4·4·4·4 |
| L07 (16) | 07-1 在家里 Ở nhà · 07-2 去机场的路上 Trên đường ra sân bay · 07-3 在健身房 Phòng tập thể dục · 07-4 在路上 Trên đường | 4·4·4·4 |
| L08 (16) | 08-1 在教室 Trong lớp học · 08-2 在宿舍 Ở ký túc xá · 08-3 在宾馆的前台 Tại quầy lễ tân · 08-4 在商店 Ở cửa hàng | 4·4·4·4 |
| L09 (15) | 09-1 打电话 Gọi điện thoại · 09-2 在学校 Ở trường · 09-3 在家里 Ở nhà · 09-4 在教室 Trong lớp học | 3·4·4·4 |
| L10 (18) | 10-1 在家里 Ở nhà · 10-2 在医院 Trong bệnh viện · 10-3 在家里 Ở nhà · 10-4 在家里 Ở nhà | 4·5·4·5 |
| L11 (16) | 11-1 在歌厅 Ở quán karaoke · 11-2 在宿舍 Ở ký túc xá · 11-3 在商店 Ở cửa hàng · 11-4 在学校 Ở trường | 4·4·4·4 |
| L12 (16) | 12-1 在教室 Trong lớp học · 12-2 在朋友家 Ở nhà bạn · 12-3 在家门口 Ở trước cửa nhà · 12-4 在家里 Ở nhà | 4·4·4·4 |
| L13 (16) | 13-1 在办公室 Trong văn phòng · 13-2 在办公室 Trong văn phòng · 13-3 在运动场 Sân vận động · 13-4 在路上 Trên đường | 4·4·4·4 |
| L14 (16) | 14-1 在教室 Trong lớp học · 14-2 在办公室 Trong văn phòng · 14-3 在房间 Trong phòng · 14-4 在商店 Ở cửa hàng | 4·4·4·4 |
| L15 (16) | 15-1 在朋友家 Ở nhà bạn · 15-2 在公司 Trong công ty · 15-3 在车站 Ở bến xe · 15-4 在咖啡馆门口 Ở trước quán cà phê | 5·3·4·4 |

## 3. Phương án

### A. Bảng `dialogues` riêng (entity nhóm)
`Dialogue(id, lessonId, order 1-4, code "01-1", titleHanzi, titleVi)` + `Conversation.dialogueId FK`.
- Ưu: model đúng sách; mở rộng sau này (audio theo đoạn, progress theo đoạn, đổi tên đoạn không đụng từng dòng).
- Nhược: migration + importer + API + frontend đều đụng; hôm nay chưa có use-case per-dialogue.

### B. Denormalize 2 cột trên `Conversation` (khuyến nghị)
Thêm `dialogueOrder Int` + `dialogueTitleHanzi String?` + `dialogueTitleVi String?` (hoặc gộp 1 cột title). Data điền theo bảng trên; `orderBy [dialogueOrder, order]`.
- Ưu: 1 migration nhỏ + importer thêm 3 field + DTO thêm 2-3 field; UI nhóm được ngay; progress lesson-level giữ nguyên không đụng.
- Nhược: title lặp 4 lần/lesson — chấp nhận được vì dữ liệu tĩnh, bản quyền sách.
- Lên cấp A sau chỉ cần 1 migration data chuyển qua bảng — không mất gì.

### C. Heuristic client-side
Tự đoán ranh giới bằng speaker/số dòng — unreliable (đã gây lỗi L06), loại.

## 4. Kế hoạch triển khai khi được duyệt (theo B)

1. Migration Prisma: thêm 3 cột trên `conversations` (nullable, không breaking).
2. Bổ sung bảng nhóm vào `hsk2-textbook-v2-fixed.json` (split turn theo turn-count đã verify) + nâng cấp `TextbookV2Importer` ghi 3 cột.
3. Re-import live DB (idempotent như đợt trước, qua tunnel 5433).
4. Backend: `DialogueLineDto` thêm `dialogueOrder/dialogueTitle`; `daily-session` orderBy dialogueOrder trước order.
5. Frontend: practice-runner hiển thị header "Đoạn N — Ở trường" giữa các nhóm (tùy chọn: luyện theo từng đoạn).
6. Verify: count 245, mỗi nhóm đúng turn, UI hiển thị nhóm.

Ước lượng: backend + data ~1 phiên; frontend hiển thị ~1 phiên nhỏ.

## 5. Đã triển khai (cùng ngày — user duyệt phương án B)

| Bước | Kết quả |
|---|---|
| Migration `add_conversation_dialogue_grouping` (3 cột nullable: dialogueOrder, dialogueTitleHanzi, dialogueTitleVi) | ✓ áp cả dev (5432) + live (tunnel 5433) |
| `TextbookV2ConversationItemDto` + `JsonV2Mapper.toConversationCreate` | ✓ map 3 field mới (`dialogue_order/title_hanzi/title_vi` từ JSON) |
| `DialogueLineDto` + `toLineDto` + orderBy `[{dialogueOrder},{order}]` (2 chỗ) | ✓ |
| Frontend: `DialogueLine` interface + LyricsPanel header "Đoạn N · 在学校 (Ở trường)" khi dialogueOrder đổi | ✓ (header gắn vị trí dòng — không gây giật panel) |
| Data: 60 nhóm gán vào 15 file `lesson-XX.import.json` + file merge (field `dialogue_code` giữ làm metadata nguồn) | ✓ 60 nhóm / 245 turn, khớp bảng nhóm đã verify |
| Re-import live DB | ✓ 245/245 dòng có nhóm, 0 dòng null, 60 nhóm đúng turn |
| Kiểm chứng | ✓ tsc backend + frontend exit 0; jest import + daily-session: 21/21 pass |

Lưu ý deploy: data đã nằm sẵn trong live DB; UI nhóm hiển thị sau khi deploy backend + frontend mới lên VPS (backend deploy tự chạy `migrate deploy` — không còn pending migration). API cũ không bị break (field mới là additive).

## Unresolved questions
1. Chọn phương án B (khuyến nghị) hay A?
2. Frontend chỉ cần **hiển thị tên nhóm**, hay muốn **luyện/shadowing theo từng đoạn** (chia phiên ngắn hơn)?
