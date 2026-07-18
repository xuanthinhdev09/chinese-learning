import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    // Return user without sensitive data
    return this.excludePasswordHash(user);
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

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    });

    return this.excludePasswordHash(updatedUser);
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
