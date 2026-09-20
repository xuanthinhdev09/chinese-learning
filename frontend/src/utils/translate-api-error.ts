import type { TFunction } from 'i18next';

/**
 * Backend error messages (NestJS, English) → i18n keys. Backend stays
 * English-only; the frontend maps known messages at display time. Anything
 * unmapped surfaces raw so no error detail is ever lost. class-validator
 * arrays are already collapsed to their first message by the api modules.
 */
const MESSAGE_TO_KEY: Record<string, string> = {
  'Invalid credentials': 'errors.invalidCredentials',
  'Email already registered': 'errors.emailRegistered',
  'Username already taken': 'errors.usernameTaken',
  'Invalid avatar selection': 'errors.invalidAvatar',
  'Current password is incorrect': 'errors.wrongPassword',
  'User not found': 'errors.userNotFound',
  'Email must be a valid email address': 'errors.invalidEmail',
  'Username must be at least 3 characters': 'errors.usernameTooShort',
  'Username must not exceed 20 characters': 'errors.usernameTooLong',
  'Password must be at least 8 characters': 'errors.passwordTooShort',
  // Frontend-thrown guard messages (api modules) follow the same contract
  'Failed to load study plan': 'errors.loadPlanFailed',
  'Failed to save dialogue review': 'errors.saveDialogueReview',
  'Failed to record session completion': 'errors.saveSessionCompletion',
  'Failed to load stats': 'errors.loadStats',
  'Failed to update profile': 'errors.updateProfileFailed',
  'Failed to change password': 'errors.changePasswordFailed',
  // auth-store fallbacks when the backend returns no message body
  'Login failed': 'auth.login.failed',
  'Registration failed': 'auth.register.failed',
};

export function translateApiError(err: unknown, t: TFunction): string {
  // Zustand stores expose error as a plain string; accept both shapes
  const message = typeof err === 'string' ? err : err instanceof Error ? err.message : '';
  if (message) {
    const key = MESSAGE_TO_KEY[message];
    if (key) return t(key);
    return message;
  }
  return t('errors.unknown');
}
