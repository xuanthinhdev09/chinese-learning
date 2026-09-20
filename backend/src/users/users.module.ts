import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersStatsService } from './users-stats.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Users Module
 * Handles user profile operations
 */
@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UsersStatsService],
  exports: [UsersService, UsersStatsService],
})
export class UsersModule {}
