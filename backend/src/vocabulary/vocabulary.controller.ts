import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { VocabularyService, ImportVocabularyItem } from './vocabulary.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Nội dung từ vựng yêu cầu đăng nhập + bị chặn theo tiến độ học tuần tự;
// statistics chỉ là số liệu tổng hợp nên giữ public
@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get('lesson/:lessonId')
  @HttpCode(HttpStatus.OK)
  async findByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { userId: string; email: string }
  ) {
    return this.vocabularyService.findByLesson(lessonId, user.userId, user.email);
  }

  @Get('hsk-level/:level')
  @HttpCode(HttpStatus.OK)
  async findByHSKLevel(
    @Param('level') level: string,
    @CurrentUser() user: { userId: string; email: string }
  ) {
    // Phạm vi "tất cả từ" bị cap theo tiến độ của user ngay trên server
    return this.vocabularyService.findByHSKLevel(parseInt(level), user.userId, user.email);
  }

  @Public()
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics() {
    return this.vocabularyService.getStatistics();
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  async importVocabularies(
    @Body('lessonId') lessonId: string,
    @Body('csvContent') csvContent: string,
    @Body('maxLevel') maxLevel?: number,
  ) {
    const items = this.vocabularyService.parseHSK30Csv(csvContent, lessonId, maxLevel || 2);
    const result = await this.vocabularyService.importVocabularies(items);
    return {
      imported: result.count,
      total: items.length,
    };
  }

  @Post('lesson/:lessonId/clear')
  @HttpCode(HttpStatus.OK)
  async clearLesson(@Param('lessonId') lessonId: string) {
    await this.vocabularyService.deleteByLesson(lessonId);
    return { message: 'Lesson vocabulary cleared' };
  }
}
