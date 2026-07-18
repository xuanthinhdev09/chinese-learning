import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Custom extractor to get JWT from cookie or Authorization header
const cookieExtractor = (request: Request): string | null => {
  // First try to get from cookie (for httpOnly cookies)
  let token = null;
  if (request && request.cookies) {
    token = request.cookies['accessToken'];
  }

  // Fallback to Authorization header (for manual Bearer token)
  if (!token) {
    token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  }

  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
