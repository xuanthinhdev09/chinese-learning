import { ConfigService } from '@nestjs/config';

/**
 * Refresh tokens are signed with their own secret.
 *
 * Access and refresh tokens carry identical claims apart from `exp`, so a
 * shared secret would make them interchangeable as far as signature
 * verification goes — only the database lookup would tell them apart. Signing
 * them separately keeps that distinction in the crypto rather than in a query.
 *
 * Falls back to JWT_SECRET so a deployment that has not set the dedicated
 * value keeps working; setting it (or changing it later) invalidates every
 * refresh token issued under the old secret, logging everyone out once.
 */
export function refreshTokenSecret(configService: ConfigService): string {
  const secret =
    configService.get<string>('JWT_REFRESH_SECRET') ||
    configService.get<string>('JWT_SECRET');

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET must be set');
  }

  return secret;
}
