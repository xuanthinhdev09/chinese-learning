# Chinese Learning Platform - Software Requirements Specification (SRS)

## 1. Giới thiệu

### Mục tiêu

Xây dựng một nền tảng học tiếng Trung trực tuyến cho người học HSK, cho
phép:

-   Học theo giáo trình HSK 1 → HSK 6
-   Làm bài kiểm tra
-   Theo dõi tiến độ học
-   Ôn tập các câu trả lời sai
-   Lưu lịch sử học
-   Hỗ trợ tích hợp AI trong tương lai

## 2. Đối tượng sử dụng

### Guest

-   Xem trang chủ
-   Đăng ký
-   Đăng nhập

### Student

-   Học bài
-   Làm quiz
-   Theo dõi tiến độ
-   Xem thống kê
-   Ôn tập câu sai

### Admin

-   Quản lý người dùng
-   Quản lý HSK
-   Quản lý bài học
-   Quản lý câu hỏi
-   Quản lý thống kê

## 3. Authentication

### Đăng ký

-   Email
-   Username
-   Password

Yêu cầu: - Email duy nhất - Username duy nhất - Password tối thiểu 8 ký
tự

### Đăng nhập

-   Email + Password
-   JWT Access Token
-   Refresh Token

### Đăng xuất

-   Thu hồi Refresh Token

### Quên mật khẩu

-   Thực hiện ở giai đoạn sau

## 4. Cấu trúc HSK

    HSK 1
     ├── Lesson 1
     ├── Lesson 2
     └── ...

    HSK 2
     ├── Lesson 1
     └── ...

## 5. Lesson

Mỗi Lesson gồm: - Tiêu đề - Mô tả - Từ vựng - Ngữ pháp - Quiz

## 6. Vocabulary

Mỗi từ gồm: - Hanzi - Pinyin - Nghĩa - Audio - Ví dụ - Loại từ

Ví dụ:

    谢谢
    xiè xie
    Cảm ơn

    Ví dụ:
    谢谢你。

## 7. Grammar

-   Điểm ngữ pháp
-   Giải thích
-   Ví dụ

## 8. Quiz

Khoảng 20 câu mỗi bài.

Các dạng: - Multiple Choice - Điền từ - Chọn Pinyin - Chọn nghĩa - Sắp
xếp câu

## 9. Quiz Result

Hiển thị: - Điểm - Thời gian - Số câu đúng - Số câu sai - Chi tiết từng
câu

## 10. Wrong Answer Review

-   Xem câu sai
-   Làm lại
-   Xóa khỏi danh sách ôn tập

## 11. Learning Progress

Theo dõi: - Lesson hoàn thành - Quiz hoàn thành - % tiến độ

## 12. History

Lưu: - Ngày học - Điểm - Thời gian - Số lần làm

## 13. Dashboard

Hiển thị: - Lesson đã học - Quiz hoàn thành - Tổng thời gian học - Chuỗi
ngày học (Streak) - Tỷ lệ đúng

## 14. Search

Tìm kiếm theo: - Hanzi - Pinyin - Nghĩa

## 15. User Profile

-   Avatar
-   Username
-   Email
-   Ngày tham gia
-   Tổng điểm
-   HSK hiện tại

## 16. Admin

Quản lý: - Users - HSK Levels - Lessons - Vocabulary - Grammar -
Quizzes - Questions

## 17. Non-functional Requirements

### Performance

-   API \< 300ms
-   Trang đầu \< 2 giây
-   Lazy Loading
-   Pagination

### Security

-   JWT
-   Argon2/Bcrypt
-   HTTPS
-   Rate Limiting
-   CORS
-   Helmet
-   Input Validation

### Database

-   Soft Delete (`deleted_at`)

### Logging

-   Login
-   Register
-   Quiz
-   Error

### Responsive

-   Desktop
-   Tablet
-   Mobile

### Accessibility

-   Keyboard Navigation
-   Semantic HTML
-   High Contrast

## 18. Technology Stack

### Frontend

-   React
-   TypeScript
-   Vite
-   React Router
-   TanStack Query
-   Zustand
-   TailwindCSS
-   shadcn/ui

### Backend

-   NestJS
-   Prisma
-   PostgreSQL
-   JWT
-   Swagger

### Infrastructure

-   Docker
-   Docker Compose
-   Nginx
-   Ubuntu
-   Hetzner Cloud

## 19. API

    POST /auth/register
    POST /auth/login
    GET  /me

    GET  /hsk
    GET  /lessons
    GET  /lesson/:id

    GET  /quiz/:id
    POST /quiz/submit

    GET  /progress
    GET  /history
    GET  /review

## 20. Database (High Level)

-   users
-   refresh_tokens
-   hsk_levels
-   lessons
-   vocabularies
-   grammar_points
-   quizzes
-   questions
-   choices
-   user_quiz_attempts
-   user_answers
-   user_progress
-   review_items

## 21. Mục tiêu kiến trúc

Thiết kế theo hướng có thể mở rộng:

-   Module hóa backend
-   REST API nhất quán
-   Dễ tích hợp Mobile App
-   Sẵn sàng mở rộng AI
-   Production-ready với Docker + Nginx + PostgreSQL
