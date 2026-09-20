/**
 * Preset avatar emojis shown in the picker. Mirrors the backend list
 * (backend/src/users/constants/avatar-emojis.ts) which validates PATCH
 * /users/me — keep the two in sync.
 */
export const AVATAR_EMOJIS: string[] = [
  '👤', '😊', '🇨🇳', '📚', '🎯', '🔥',
  '🐱', '🐼', '🦊', '🐯', '🐰', '🐨',
  '🌟', '🌸', '🍀', '🌈', '⚡', '🎈',
  '🚀', '🍵', '🥟', '🧧', '🏮', '⛩️',
];
