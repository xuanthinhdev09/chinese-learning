import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { DailySessionService } from './daily-session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CompleteSessionDto, CompleteSessionResultDto, DailySessionResponseDto, DialogueReviewResultDto, RecordDialogueReviewDto } from './dto/daily-session.dto';

@Controller('daily-session')
@UseGuards(JwtAuthGuard)
export class DailySessionController {
  constructor(private readonly dailySessionService: DailySessionService) {}

  /**
   * GET /daily-session — compose today's learning plan
   */
  @Get()
  async getDailySession(
    @CurrentUser() user: any,
    @Query('courseId') courseId?: string
  ): Promise<DailySessionResponseDto> {
    return this.dailySessionService.getDailySession(user.userId, courseId || undefined);
  }

  /**
   * POST /daily-session/dialogue-review — record a dialogue shadowing review
   */
  @Post('dialogue-review')
  @HttpCode(HttpStatus.OK)
  async recordDialogueReview(
    @CurrentUser() user: any,
    @Body() dto: RecordDialogueReviewDto
  ): Promise<DialogueReviewResultDto> {
    return this.dailySessionService.recordDialogueReview(user.userId, dto);
  }

  /**
   * POST /daily-session/complete — mark the session's lesson completed
   */
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeSession(
    @CurrentUser() user: any,
    @Body() dto: CompleteSessionDto
  ): Promise<CompleteSessionResultDto> {
    return this.dailySessionService.completeSession(user.userId, dto);
  }
}
