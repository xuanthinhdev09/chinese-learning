/**
 * Admin bypass cho khóa tuần tự (sequential unlock).
 *
 * Email nằm trong ADMIN_EMAILS (phân tách bằng dấu phẩy) được truy cập mọi
 * bài học, bỏ qua lock ở server (vocabulary.service) lẫn ẩn lock trên UI.
 * Source-of-truth duy nhất — frontend nhận `isAdmin` qua GET /users/me.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
