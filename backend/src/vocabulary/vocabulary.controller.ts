import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { VocabularyService, ImportVocabularyItem } from './vocabulary.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Public()
  @Get('lesson/:lessonId')
  @HttpCode(HttpStatus.OK)
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.vocabularyService.findByLesson(lessonId);
  }

  @Public()
  @Get('hsk-level/:level')
  @HttpCode(HttpStatus.OK)
  async findByHSKLevel(@Param('level') level: string) {
    const levelNum = parseInt(level);
    return this.vocabularyService.findByHSKLevel(levelNum);
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