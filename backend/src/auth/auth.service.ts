import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  durationToMs,
  DEFAULT_ACCESS_TOKEN_TTL,
  DEFAULT_REFRESH_TOKEN_TTL,
  REFRESH_TOKEN_ROTATION_GRACE_MS,
} from './token-lifetimes';
import { refreshTokenSecret } from './token-secrets';
import { isAdminEmail } from '../common/admin';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user
   * - Validates unique email and username
   * - Hashes password with bcrypt (cost factor 12)
   * - Creates user in database
   */
  async register(registerDto: RegisterDto): Promise<{
    id: string;
    email: string;
    username: string;
    avatar: string | null;
    createdAt: Date;
    isAdmin: boolean;
  }> {
    const { email, username, password } = registerDto;

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    // Return user without sensitive data
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      isAdmin: isAdminEmail(user.email),
    };
  }

  /**
   * Login user
   * - Verifies email and password
   * - Generates JWT access token (15 min expiry)
   * - Generates refresh token (7 day expiry)
   * - Stores refresh token in database
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password (timing-safe comparison via bcrypt)
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token in database; the row expires with the JWT itself
    const refreshTokenExpiresAt = new Date(Date.now() + this.refreshTtlMs());

    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        isAdmin: isAdminEmail(user.email),
      },
    };
  }

  /**
   * Exchange a refresh token for a new access token.
   *
   * The refresh token is rotated on every call and its replacement carries a
   * full lifetime, so a user who keeps using the app is never logged out —
   * the session slides forward instead of dying a fixed time after login.
   * The presented token stays usable for a short grace window so concurrent
   * tabs racing the same refresh do not knock each other out.
   */
  async refreshTokens(refreshToken: string) {
    // Verify refresh token exists and is valid
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
    );

    const now = Date.now();
    const graceExpiresAt = new Date(now + REFRESH_TOKEN_ROTATION_GRACE_MS);

    await this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: storedToken.userId,
          expiresAt: new Date(now + this.refreshTtlMs()),
        },
      }),
      // Shorten the replaced token to the grace window. The expiry guard
      // keeps this from ever extending a token already closer to expiry
      // than the window itself.
      this.prisma.refreshToken.updateMany({
        where: { id: storedToken.id, expiresAt: { gt: graceExpiresAt } },
        data: { expiresAt: graceExpiresAt },
      }),
      // Rotation leaves short-lived rows behind; drop this user's dead ones.
      this.prisma.refreshToken.deleteMany({
        where: { userId: storedToken.userId, expiresAt: { lt: new Date(now) } },
      }),
    ]);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout user
   * - Deletes refresh token from database
   */
  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    return { message: 'Logged out successfully' };
  }

  /** How long a refresh token — and its database row — stays valid. */
  private refreshTtlMs(): number {
    return durationToMs(
      this.configService.get<string>(
        'REFRESH_TOKEN_EXPIRES_IN',
        DEFAULT_REFRESH_TOKEN_TTL,
      ),
    );
  }

  /**
   * Generate JWT tokens for a user
   */
  private async generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', DEFAULT_ACCESS_TOKEN_TTL),
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        // Unique per token: two refreshes in the same second would otherwise
        // produce byte-identical JWTs and collide on the token unique index.
        jti: randomUUID(),
      },
      {
        secret: refreshTokenSecret(this.configService),
        expiresIn: this.configService.get<string>(
          'REFRESH_TOKEN_EXPIRES_IN',
          DEFAULT_REFRESH_TOKEN_TTL,
        ),
      },
    );

    return { accessToken, refreshToken };
  }
}
