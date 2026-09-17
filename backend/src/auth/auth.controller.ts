import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

/**
 * Cookie Secure flag: COOKIE_SECURE env overrides explicitly ("false" only
 * for a temporary HTTP-only deployment — tokens travel unencrypted there);
 * otherwise secure whenever running in production.
 */
function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

/** Parse jwt-style durations ("30s", "15m", "7d") into milliseconds. */
function durationToMs(duration: string): number {
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
 * Refresh cookie lifetime mirrors REFRESH_TOKEN_EXPIRES_IN (the same value
 * the JWT is signed with) so the cookie never outlives the token it holds.
 */
function refreshCookieMaxAge(): number {
  return durationToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   * - Public endpoint (no auth required)
   * - Rate limited: 5 requests per minute
   * - Returns user data only (no tokens - user must login separately)
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Login user
   * POST /auth/login
   * - Public endpoint (no auth required)
   * - Rate limited: 5 requests per minute
   * - Sets httpOnly cookies for tokens
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);

    // Set httpOnly cookies for tokens
    // Access token cookie (15 min)
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Refresh token cookie (duration follows REFRESH_TOKEN_EXPIRES_IN)
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'strict',
      maxAge: refreshCookieMaxAge(),
      path: '/',
    });

    return result;
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   * - Uses refresh token from cookie
   * - Returns new access token
   * - Updates access token cookie
   */
  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refreshToken'];
    const result = await this.authService.refreshTokens(refreshToken);

    // Update access token cookie
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    return result;
  }

  /**
   * Logout user
   * POST /auth/logout
   * - Requires valid access token
   * - Deletes refresh token from database
   * - Clears httpOnly cookies
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = request['user'] as { userId: string };
    const refreshToken = request.cookies['refreshToken'];

    // Delete refresh token from database
    await this.authService.logout(user.userId, refreshToken);

    // Clear httpOnly cookies
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'strict',
      path: '/',
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }
}
