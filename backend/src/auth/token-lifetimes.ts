/**
 * Single source of truth for how long auth tokens live.
 *
 * Cookie maxAge, the JWT `expiresIn` claim and the refresh-token row in the
 * database all derive from the same two env values, so changing one can never
 * leave the cookie outliving the token it carries (or the reverse).
 */

/** Used when JWT_EXPIRES_IN is unset. */
export const DEFAULT_ACCESS_TOKEN_TTL = '15m';

/** Used when REFRESH_TOKEN_EXPIRES_IN is unset — how long a login lasts. */
export const DEFAULT_REFRESH_TOKEN_TTL = '30d';

/** Parse jwt-style durations ("30s", "15m", "7d") into milliseconds. */
export function durationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 24 * 60 * 60 * 1000;
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return Number(match[1]) * unitMs[match[2]];
}

/**
 * How long a rotated refresh token keeps working after being replaced.
 *
 * Two browser tabs hitting an expired access token at the same moment both
 * post the old refresh token; without this window the loser of the race would
 * present a token that no longer exists and be logged out.
 */
export const REFRESH_TOKEN_ROTATION_GRACE_MS = 30 * 1000;
