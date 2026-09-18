import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { refreshTokenSecret } from '../token-secrets';

/**
 * Accepts the refresh token from its httpOnly cookie and nothing else.
 *
 * Registered under its own strategy name so the refresh endpoint cannot fall
 * back to the access-token extractor: /auth/refresh is called precisely when
 * the access token has already expired, so honouring one there would make the
 * endpoint reject every request that actually needs it.
 */
const refreshCookieExtractor = (request: Request): string | null =>
  request?.cookies?.['refreshToken'] || null;

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([refreshCookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: refreshTokenSecret(configService),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
