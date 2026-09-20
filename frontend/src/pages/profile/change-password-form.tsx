import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChangePasswordMutation } from './hooks/use-profile-hooks';
import { translateApiError } from '../../utils/translate-api-error';

/**
 * Change-password card: current, new, confirm. Confirm-match and min-length
 * are checked client-side; wrong current password surfaces the backend error.
 */
export function ChangePasswordForm() {
  const { t } = useTranslation();
  const changePasswordMutation = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    setSuccessMessage('');

    if (newPassword.length < 8) {
      setClientError(t('profile.newPasswordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setClientError(t('profile.passwordMismatch'));
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setSuccessMessage(t('profile.passwordChanged'));
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  const errorMessage = clientError
    || (changePasswordMutation.error ? translateApiError(changePasswordMutation.error, t) : '');

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.passwordTitle')}</h3>

      <div className="space-y-4 mb-4">
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('profile.currentPassword')}
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('profile.newPassword')}
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('profile.confirmNewPassword')}
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p className="text-sm text-green-600 mb-4" role="status">
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={changePasswordMutation.isPending}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {changePasswordMutation.isPending ? t('profile.changing') : t('profile.passwordTitle')}
      </button>
    </form>
  );
}
