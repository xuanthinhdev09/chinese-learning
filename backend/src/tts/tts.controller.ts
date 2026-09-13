import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Body,
  Res,
  ServiceUnavailableException,
  BadGatewayException,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TtsService } from './tts.service';
import { SynthesizeTextDto } from './dto/synthesize-text.dto';
import { SynthesizeDialogueDto } from './dto/synthesize-dialogue.dto';
import { TtsError } from './providers/tts-provider.interface';

/**
 * Class-level @SkipThrottle keeps audio reads unlimited; each write route
 * re-enables throttling with @SkipThrottle(false) — in throttler v5 the
 * class-level skip flag wins over a plain @Throttle() limit.
 */
@SkipThrottle()
@UseGuards(ThrottlerGuard)
@Controller('tts')
export class TtsController {
  private readonly logger = new Logger(TtsController.name);

  constructor(private readonly ttsService: TtsService) {}

  @UseGuards(JwtAuthGuard)
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('synthesize')
  async synthesize(@Body() dto: SynthesizeTextDto) {
    try {
      return await this.ttsService.synthesizeText(dto);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('dialogue')
  async dialogue(@Body() dto: SynthesizeDialogueDto) {
    try {
      return await this.ttsService.synthesizeDialogue(dto);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  /**
   * Public by design: pronunciation audio of public curriculum text. Cache
   * keys are deterministic sha256 hashes of the synthesis parameters, so
   * they are computable offline — acceptable because the content is public.
   */
  @Get('audio/:cacheKey')
  async audio(@Param('cacheKey') cacheKey: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    if (!/^[a-f0-9]{64}$/.test(cacheKey)) {
      throw new BadRequestException('INVALID_CACHE_KEY');
    }

    const audio = await this.ttsService.readCachedAudio(cacheKey);
    if (!audio) {
      throw new NotFoundException('AUDIO_NOT_FOUND');
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audio.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    return new StreamableFile(audio);
  }

  /** Domain errors → stable HTTP codes; internals stay generic + logged. */
  private toHttpError(error: unknown): Error {
    if (!(error instanceof TtsError)) {
      this.logger.error(`TTS endpoint failure: ${error instanceof Error ? error.message : String(error)}`);
      return new InternalServerErrorException('TTS_ERROR');
    }
    switch (error.code) {
      case 'TTS_NOT_CONFIGURED':
      case 'TTS_QUOTA':
        return new ServiceUnavailableException(error.code);
      case 'TTS_UPSTREAM':
        return new BadGatewayException(error.code);
      default:
        this.logger.error(`TTS ${error.code}: ${error.message}`);
        return new InternalServerErrorException('TTS_ERROR');
    }
  }
}
