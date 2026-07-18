import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonQueryDto } from './dto/lesson-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: LessonQueryDto) {
    return this.lessonsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }
}