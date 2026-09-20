import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersStatsService } from './users-stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * Users Controller
 * Handles user profile operations
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersStatsService: UsersStatsService,
  ) {}

  /**
   * Get current user profile
   * GET /users/me
   * @param user - Current user from JWT
   * @returns User profile
   */
  @Get('me')
  async getProfile(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }

  /**
   * Update current user profile
   * PATCH /users/me
   * @param user - Current user from JWT
   * @param dto - Data to update (username, avatar)
   * @returns Updated user profile
   */
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  /**
   * Learning statistics for the current user
   * GET /users/me/stats
   * @param user - Current user from JWT
   * @returns Vocabulary/lesson counts, streak and active days
   */
  @Get('me/stats')
  async getStats(@CurrentUser() user: { userId: string }) {
    return this.usersStatsService.getStats(user.userId);
  }

  /**
   * Change current user password
   * PATCH /users/me/password
   * @param user - Current user from JWT
   * @param dto - Current + new password
   */
  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
