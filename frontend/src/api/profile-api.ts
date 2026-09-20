import { apiClient } from '../lib/api-client';

export interface ProfileStats {
  vocabularyLearned: number;
  lessonsCompleted: number;
  streakDays: number;
  activeDays: number;
}

export interface ProfileUser {
  id: string;
  email: string;
  username: string;
  // API returns null for an unset avatar (Prisma String? field)
  avatar: string | null;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
}

/**
 * NestJS error body is { message, error, statusCode }; message can be a
 * string or a string[] (class-validator). Pick the first readable message.
 */
async function extractErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message[0];
    }
  } catch {
    // Body was not JSON — fall through to fallback
  }
  return fallback;
}

export async function getProfileStats(): Promise<ProfileStats> {
  const response = await apiClient.get('/users/me/stats');
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, 'Không tải được thống kê')
    );
  }
  return response.json();
}

export async function updateProfile(
  data: UpdateProfileRequest
): Promise<ProfileUser> {
  const response = await apiClient.patch('/users/me', data);
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, 'Cập nhật profile thất bại')
    );
  }
  return response.json();
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await apiClient.patch('/users/me/password', body);
  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, 'Đổi mật khẩu thất bại')
    );
  }
  return response.json();
}
