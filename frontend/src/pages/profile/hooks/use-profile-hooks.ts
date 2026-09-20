import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth-store';
import {
  changePassword,
  getProfileStats,
  updateProfile,
  UpdateProfileRequest,
} from '../../../api/profile-api';

/**
 * Learning stats for the profile page. Short staleTime so returning to the
 * page after a study session picks up fresh numbers without hammering the API.
 */
export function useProfileStats() {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: getProfileStats,
    staleTime: 60_000,
  });
}

/**
 * PATCH /users/me — on success syncs the zustand auth store so header,
 * mobile menu and profile view reflect the new username/avatar immediately.
 * API avatar can be null; the store type uses undefined for "unset".
 */
export function useUpdateProfileMutation() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (user) => {
      updateUser({
        username: user.username,
        avatar: user.avatar ?? undefined,
      });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      changePassword(body),
  });
}
