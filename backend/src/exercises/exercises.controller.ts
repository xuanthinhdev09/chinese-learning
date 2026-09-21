import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard, SkipThrottle, Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExercisesService } from './exercises.service';

/**
 * Class-level @SkipThrottle keeps media reads unlimited (a lesson page loads
 * ~27 images at once); the upload route re-enables throttling with
 * @SkipThrottle(false) — in throttler v5 the class-level skip flag wins over
 * a plain @Throttle() limit. All routes are JWT-guarded: workbook content is
 * copyrighted (BLCUP) and must never be served publicly.
 */
@SkipThrottle()
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @HttpCode(HttpStatus.OK)
  @Get('lesson/:lessonId')
  async getLessonExercises(@Param('lessonId') lessonId: string) {
    return this.exercisesService.getLessonExercises(lessonId);
  }

  @Get('images/:imageId/file')
  async getImage(
    @Param('imageId') imageId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const image = await this.exercisesService.readImage(imageId);
    res.set({
      'Content-Type': image.contentType,
      'Cache-Control': 'private, max-age=86400',
    });
    return new StreamableFile(image.data);
  }

  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('images/:imageId/file')
  async uploadImage(
    @Param('imageId') imageId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('FILE_REQUIRED');
    }
    return this.exercisesService.saveImage(imageId, file);
  }

  @Get('audio/:filename')
  async getAudio(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const data = await this.exercisesService.readAudio(filename);
    res.set({
      'Content-Type': 'audio/mpeg',
      // Not immutable: a track can be re-uploaded under the same NN-N name.
      'Cache-Control': 'private, max-age=86400',
    });
    return new StreamableFile(data);
  }
}
