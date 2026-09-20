import { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { useUpdateProfileMutation } from './hooks/use-profile-hooks';
import { AvatarEmojiPicker } from './avatar-emoji-picker';

export interface ProfileEditFormProps {
  onCancel: () => void;
}

/**
 * Inline edit form replacing the profile card in edit mode:
 * avatar emoji picker + username field, Lưu/Hủy actions.
 */
export function ProfileEditForm({ onCancel }: ProfileEditFormProps) {
  const user = useAuthStore((s) => s.user);
  const updateProfileMutation = useUpdateProfileMutation();

  const [username, setUsername] = useState(user?.username ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '👤');
  const [clientError, setClientError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    if (username.trim().length < 3 || username.trim().length > 20) {
      setClientError('Tên phải từ 3 đến 20 ký tự');
      return;
    }

    // Only send what changed so an untouched form never trips the
    // backend uniqueness/validity checks.
    const payload: { username?: string; avatar?: string } = {};
    if (username.trim() !== user?.username) payload.username = username.trim();
    if (avatar !== user?.avatar) payload.avatar = avatar;

    if (Object.keys(payload).length === 0) {
      onCancel();
      return;
    }

    updateProfileMutation.mutate(payload, { onSuccess: onCancel });
  };

  const errorMessage = clientError || updateProfileMutation.error?.message;

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Avatar
        </label>
        <AvatarEmojiPicker value={avatar} onChange={setAvatar} />
      </div>

      <div className="mb-4">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tên người dùng
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="3-20 ký tự"
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={updateProfileMutation.isPending}
          className="flex-1 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
