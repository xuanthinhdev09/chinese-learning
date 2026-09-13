import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTtsCacheKey, normalizeText } from './tts-cache-key';
import { alternateSpeaker, SpeakerId, resolveSpeakerVoices } from './tts-voice-map';
import { buildDialogueSsml, buildTextSsml } from './ssml/ssml.builder';
import { SsmlDialogueLine } from './ssml/ssml.types';
import { SynthesizeTextDto } from './dto/synthesize-text.dto';
import { SynthesizeDialogueDto } from './dto/synthesize-dialogue.dto';
import { TtsProvider, TtsError } from './providers/tts-provider.interface';
import { TTS_PROVIDER } from './tts.provider-token';
import { TtsCacheService } from './tts-cache.service';
import { TtsStorage } from './tts-storage.service';
import { TTS_STORAGE } from './tts.storage-token';

export const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
/** Fallback when neither the request nor TTS_PAUSE_MS specifies a pause. */
export const DEFAULT_PAUSE_MS = 300;

export interface TtsSynthesisResult {
  audioUrl: string;
  cached: boolean;
}

/**
 * Cache-first TTS orchestration: same synthesis parameters never hit Azure
 * twice. The provider is only invoked on a cache miss — and only when Azure
 * credentials exist; cached audio keeps serving without them.
 */
@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly cache: TtsCacheService,
    @Inject(TTS_PROVIDER) private readonly provider: TtsProvider,
    @Inject(TTS_STORAGE) private readonly storage: TtsStorage,
  ) {}

  getSpeakerVoices(): Record<SpeakerId, string> {
    return resolveSpeakerVoices(this.config.get<string>('TTS_VOICE_MAP'));
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /** Request-level pause wins; TTS_PAUSE_MS env is the system default. */
  private defaultPauseMs(): number {
    // Compose passthrough can inject "" — Number("") is 0, so validate
    // the parsed value instead of truthiness.
    const parsed = Number(this.config.get<string>('TTS_PAUSE_MS'));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_PAUSE_MS;
  }

  async synthesizeText(dto: SynthesizeTextDto): Promise<TtsSynthesisResult> {
    const speed = dto.speed ?? 1;
    const speaker = dto.speaker ?? 'A';
    const voice = this.getSpeakerVoices()[speaker];
    const normalized = normalizeText(dto.text);
    const cacheKey = buildTtsCacheKey({
      type: 'text',
      text: normalized,
      voices: [voice],
      speed,
      pauseMs: null,
      outputFormat: OUTPUT_FORMAT,
    });

    const hit = await this.cache.find(cacheKey);
    if (hit) {
      this.logger.log(`Cache HIT text ${cacheKey.slice(0, 12)}…`);
      return { audioUrl: this.audioUrlFor(cacheKey), cached: true };
    }

    const ssml = buildTextSsml(normalized, voice, speed);
    await this.synthesizeAndStore(cacheKey, ssml, {
      type: 'text',
      text: dto.text,
      voice,
      speed,
      pauseMs: null,
      charCount: dto.text.length,
    });
    return { audioUrl: this.audioUrlFor(cacheKey), cached: false };
  }

  async synthesizeDialogue(dto: SynthesizeDialogueDto): Promise<TtsSynthesisResult> {
    const pauseMs = dto.pauseMs ?? this.defaultPauseMs();
    const speed = dto.speed ?? 1;
    const voices = this.getSpeakerVoices();

    // Null speakers alternate A/B by position; provided speakers win.
    const lines: SsmlDialogueLine[] = dto.lines.map((line, index) => ({
      speaker: line.speaker ?? alternateSpeaker(index),
      text: line.text,
    }));
    const lineVoices = lines.map((line) => voices[line.speaker]);
    const uniqueVoices = [...new Set(lineVoices)];

    const cacheKey = buildTtsCacheKey({
      type: 'dialogue',
      lines,
      voices: lineVoices,
      speed,
      pauseMs,
      outputFormat: OUTPUT_FORMAT,
    });

    const hit = await this.cache.find(cacheKey);
    if (hit) {
      this.logger.log(`Cache HIT dialogue ${cacheKey.slice(0, 12)}… (${lines.length} lines)`);
      return { audioUrl: this.audioUrlFor(cacheKey), cached: true };
    }

    const ssml = buildDialogueSsml(lines, voices, pauseMs, speed);
    await this.synthesizeAndStore(cacheKey, ssml, {
      type: 'dialogue',
      text: JSON.stringify(lines),
      voice: JSON.stringify(uniqueVoices),
      speed,
      pauseMs,
      charCount: lines.reduce((sum, line) => sum + line.text.length, 0),
    });
    return { audioUrl: this.audioUrlFor(cacheKey), cached: false };
  }

  /** Load a cached audio file for streaming. Returns null when not cached. */
  async readCachedAudio(cacheKey: string): Promise<Buffer | null> {
    const row = await this.cache.find(cacheKey);
    if (!row || !(await this.storage.exists(cacheKey))) {
      return null;
    }
    return this.storage.read(cacheKey);
  }

  private async synthesizeAndStore(
    cacheKey: string,
    ssml: string,
    meta: {
      type: string;
      text: string;
      voice: string;
      speed: number;
      pauseMs: number | null;
      charCount: number;
    },
  ): Promise<void> {
    if (!this.provider.isConfigured()) {
      throw new TtsError('TTS_NOT_CONFIGURED', 'Azure Speech credentials are not set');
    }

    const startedAt = Date.now();
    const audio = await this.provider.synthesizeSsml(ssml, OUTPUT_FORMAT);
    const filePath = await this.storage.save(cacheKey, audio);
    await this.cache.upsert({
      cacheKey,
      type: meta.type,
      text: meta.text,
      voice: meta.voice,
      locale: 'zh-CN',
      speed: meta.speed,
      pauseMs: meta.pauseMs,
      outputFormat: OUTPUT_FORMAT,
      filePath,
      charCount: meta.charCount,
    });
    this.logger.log(
      `Cache MISS ${meta.type} ${cacheKey.slice(0, 12)}… synthesized in ${Date.now() - startedAt}ms ` +
        `(${meta.charCount} chars, ${meta.voice})`,
    );
  }

  private audioUrlFor(cacheKey: string): string {
    return `/tts/audio/${cacheKey}`;
  }
}
