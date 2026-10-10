-- Sửa giọng đọc hội thoại theo giới tính nhân vật (không phải xen kẽ A/B cơ học).
-- Khóa theo (lesson.order, dialogueOrder, order) nên chạy được cho cả DB dev lẫn prod
-- (không phụ thuộc CUID lesson khác nhau giữa 2 môi trường).
--
-- Voice map tương ứng (backend/src/tts/tts-voice-map.ts):
--   A = nữ trẻ, B = nam trẻ, C = nam lớn tuổi, D = nữ lớn tuổi.
--
-- Chỉ sửa các dòng có tín hiệu giới tính rõ ràng từ xưng hô (anh/chị/cô/em/ông,
-- 我丈夫/我妻子). Các đoạn trung tính giữ nguyên A/B như cũ.

UPDATE conversations c
SET "speaker" = v.new_speaker
FROM (
  VALUES
    -- Bài 2 · 医院: bệnh nhân là nữ ("cô")
    (2, 2, 6,  'D'), (2, 2, 8,  'D'),
    -- Bài 3 · 房间: người vợ "我和我丈夫的" (nữ)
    (3, 3, 10, 'D'), (3, 3, 12, 'D'),
    -- Bài 5 · 饭馆: vợ ("em") và chồng ("anh") — hoán đổi
    (5, 1, 1,  'B'), (5, 1, 2,  'A'), (5, 1, 3,  'B'), (5, 1, 4,  'A'),
    -- Bài 7 · 公司: "chị" (nữ)
    (7, 3, 10, 'D'), (7, 3, 12, 'D'),
    -- Bài 8 · 商店: khách nữ ("cô")
    (8, 4, 14, 'D'), (8, 4, 16, 'D'),
    -- Bài 9 · 电话: người nghe là nữ ("chị"), người gọi là nam ("anh") — hoán đổi
    (9, 1, 1,  'B'), (9, 1, 2,  'A'), (9, 1, 3,  'B'),
    -- Bài 9 · 跳舞: cô giáo dạy múa là nữ ("cô")
    (9, 2, 5,  'D'), (9, 2, 7,  'D'),
    -- Bài 9 · 大卫: "chị" (nữ)
    (9, 3, 9,  'D'), (9, 3, 11, 'D'),
    -- Bài 10 · 电视: mẹ nhắc "các con" (nữ lớn tuổi)
    (10, 1, 1, 'D'), (10, 1, 3, 'D'),
    -- Bài 11 · 王方: 王方 là nữ ("cô")
    (11, 1, 2, 'D'), (11, 1, 4, 'D'),
    -- Bài 11 · 西瓜: khách là nam lớn tuổi ("ông")
    (11, 3, 9, 'C'), (11, 3, 11, 'C'),
    -- Bài 13 · 张先生: người hỏi và người trả lời đều nữ ("cô")
    (13, 1, 2, 'D'), (13, 1, 4, 'D'),
    -- Bài 14 · 中国: "anh" (nam) và "em" (nữ) — hoán đổi
    (14, 2, 5, 'B'), (14, 2, 6, 'A'), (14, 2, 7, 'B'), (14, 2, 8, 'A'),
    -- Bài 14 · 天气: "anh" (nam) và "em" (nữ) — hoán đổi
    (14, 3, 9, 'B'), (14, 3, 10, 'A'), (14, 3, 11, 'B'), (14, 3, 12, 'A'),
    -- Bài 15 · 离开: "anh phải về đây" (nam) — hoán đổi
    (15, 4, 13, 'B'), (15, 4, 14, 'A'), (15, 4, 15, 'B'), (15, 4, 16, 'A')
) AS v(lesson_order, dialogue_order, line_order, new_speaker)
JOIN lessons l ON l."order" = v.lesson_order
WHERE c."lessonId" = l.id
  AND c."dialogueOrder" = v.dialogue_order
  AND c."order" = v.line_order;
