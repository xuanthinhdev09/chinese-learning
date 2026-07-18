import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Users Controller
 * Handles user profile operations
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
   * @param updateData - Data to update (username, avatar)
   * @returns Updated user profile
   */
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() updateData: { username?: string; avatar?: string },
  ) {
    return this.usersService.updateProfile(user.userId, updateData);
  }
}
