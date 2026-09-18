import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guards /auth/refresh with the dedicated refresh strategy.
 *
 * The strategy name matters: AuthGuard only forwards passport options to
 * passport.authenticate, so a custom token extractor passed to super() here
 * would be silently ignored and the access-token strategy used instead.
 */
@Injectable()
export class RefreshJwtGuard extends AuthGuard('jwt-refresh') {}
