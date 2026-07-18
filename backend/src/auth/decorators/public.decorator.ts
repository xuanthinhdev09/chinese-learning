import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator to mark routes that don't require authentication
 * Used in conjunction with JwtAuthGuard to bypass authentication
 * @example
 * @Public()
 * @Post('register')
 * async register() { ... }
 */
export const Public = () => SetMetadata('isPublic', true);
