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
import {
  durationToMs,
  DEFAULT_ACCESS_TOKEN_TTL,
  DEFAULT_REFRESH_TOKEN_TTL,
} from './token-lifetimes';

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

/**
 * Both cookie lifetimes mirror the env values the JWTs are signed with, so a
 * cookie never outlives the token it holds.
 */
function accessCookieMaxAge(): number {
  return durationToMs(process.env.JWT_EXPIRES_IN || DEFAULT_ACCESS_TOKEN_TTL);
}

function refreshCookieMaxAge(): number {
  return durationToMs(
    process.env.REFRESH_TOKEN_EXPIRES_IN || DEFAULT_REFRESH_TOKEN_TTL,
  );
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
    // Access token cookie (duration follows JWT_EXPIRES_IN)
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'strict',
      maxAge: accessCookieMaxAge(),
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
   * - Updates both cookies: the rotated refresh token resets the session
   *   lifetime, so an active user stays logged in indefinitely
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
      maxAge: accessCookieMaxAge(),
      path: '/',
    });

    // Rotated refresh token, with its lifetime counted from now
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'strict',
      maxAge: refreshCookieMaxAge(),
      path: '/',
    });

    // The refresh token travels in the httpOnly cookie only, never in the body
    return { accessToken: result.accessToken };
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
