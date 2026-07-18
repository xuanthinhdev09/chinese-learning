import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class RefreshJwtGuard extends AuthGuard('jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract refreshToken from cookie
        (request) => {
          if (!request?.cookies) {
            return null;
          }
          return request.cookies['refreshToken'] || null;
        },
      ]),
    });
  }
}
