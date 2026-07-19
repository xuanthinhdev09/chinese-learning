import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProgressDto } from './dto/progress.dto';

@Controller('vocabulary/progress')
@UseGuards(JwtAuthGuard)
export class SpacedRepetitionController {
  constructor(private readonly spacedRepetitionService: SpacedRepetitionService) {}

  /**
   * Record learning progress for a vocabulary item
   * POST /vocabulary/progress
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async recordProgress(
    @CurrentUser() user: any,
    @Body() createProgressDto: CreateProgressDto
  ) {
    const result = await this.spacedRepetitionService.recordProgress(
      user.userId,
      createProgressDto.vocabularyId,
      createProgressDto.quality
    );
    return result;
  }

  /**
   * Get due vocabularies for review
   * GET /vocabulary/progress/due?limit=20
   */
  @Get('due')
  @HttpCode(HttpStatus.OK)
  async getDueVocabularies(
    @CurrentUser() user: any,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 20;
    const result = await this.spacedRepetitionService.getDueVocabularies(
      user.userId,
      limitNum
    );
    return result;
  }

  /**
   * Get progress statistics
   * GET /vocabulary/progress/stats
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getProgressStats(@CurrentUser() user: any) {
    const result = await this.spacedRepetitionService.getProgressStats(user.userId);
    return result;
  }

  /**
   * Get progress for a specific vocabulary
   * GET /vocabulary/progress/:vocabularyId
   */
  @Get(':vocabularyId')
  @HttpCode(HttpStatus.OK)
  async getVocabularyProgress(
    @CurrentUser() user: any,
    @Param('vocabularyId') vocabularyId: string
  ) {
    const result = await this.spacedRepetitionService.getVocabularyProgress(
      user.userId,
      vocabularyId
    );
    if (!result) {
      return { progress: null };
    }
    return { progress: result };
  }
}
