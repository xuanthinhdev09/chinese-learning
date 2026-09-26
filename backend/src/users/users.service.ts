import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { isAdminEmail } from '../common/admin';
import { AVATAR_EMOJIS } from './constants/avatar-emojis';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object without password hash
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return user without sensitive data, plus admin flag (ADMIN_EMAILS)
    return { ...this.excludePasswordHash(user), isAdmin: isAdminEmail(user.email) };
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User object without password hash
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return this.excludePasswordHash(user);
  }

  /**
   * Find user by username
   * @param username - Username
   * @returns User object without password hash
   */
  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    return this.excludePasswordHash(user);
  }

  /**
   * Update user profile
   * @param id - User ID
   * @param data - Update data (username, avatar)
   * @returns Updated user object
   */
  async updateProfile(id: string, data: { username?: string; avatar?: string }) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If updating username, check if it's already taken
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: data.username },
      });

      if (usernameExists) {
        throw new BadRequestException('Username already taken');
      }
    }

    // Avatar must be one of the preset emojis (frontend mirrors this list)
    if (data.avatar !== undefined && !AVATAR_EMOJIS.includes(data.avatar)) {
      throw new BadRequestException('Invalid avatar selection');
    }

    // Update user. A concurrent PATCH with the same new username can pass
    // the uniqueness pre-check above (TOCTOU) and hit the DB unique
    // constraint here — map that to the same 400 instead of a 500.
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.username && { username: data.username }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
      });

      return this.excludePasswordHash(updatedUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Username already taken');
      }
      throw error;
    }
  }

  /**
   * Change password: verify current password, then rehash.
   * Keeps existing sessions (refresh tokens untouched) — the current
   * session stays alive after a password change.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Soft delete user account
   * @param id - User ID
   */
  async softDelete(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'User account deleted' };
  }

  /**
   * Exclude password hash from user object
   * @param user - User object with password hash
   * @returns User object without password hash
   */
  private excludePasswordHash<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
