/**
 * Preset avatar emojis — single source of truth for avatar validation.
 * The frontend mirrors this list (frontend/src/pages/profile/avatar-emojis.ts);
 * PATCH /users/me rejects any avatar value not in this list.
 */
export const AVATAR_EMOJIS: string[] = [
  '👤', '😊', '🇨🇳', '📚', '🎯', '🔥',
  '🐱', '🐼', '🦊', '🐯', '🐰', '🐨',
  '🌟', '🌸', '🍀', '🌈', '⚡', '🎈',
  '🚀', '🍵', '🥟', '🧧', '🏮', '⛩️',
];
