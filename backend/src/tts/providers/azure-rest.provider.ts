import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TtsError, TtsProvider } from './tts-provider.interface';

const SYNTH_TIMEOUT_MS = 15_000;

/**
 * Azure AI Speech REST synthesis: one POST of the SSML document per request.
 * Uses plain axios (no heavy SDK). The subscription key never leaves the
 * server — and never enters logs, which only record status codes.
 */
@Injectable()
export class AzureRestTtsProvider implements TtsProvider {
  private readonly logger = new Logger(AzureRestTtsProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('AZURE_SPEECH_KEY') && this.config.get<string>('AZURE_SPEECH_REGION'));
  }

  async synthesizeSsml(ssml: string, outputFormat: string): Promise<Buffer> {
    const key = this.config.get<string>('AZURE_SPEECH_KEY');
    const region = this.config.get<string>('AZURE_SPEECH_REGION');
    if (!key || !region) {
      throw new TtsError('TTS_NOT_CONFIGURED', 'AZURE_SPEECH_KEY/REGION not set');
    }

    const startedAt = Date.now();
    try {
      const response = await axios.post(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, ssml, {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': outputFormat,
        },
        responseType: 'arraybuffer',
        timeout: SYNTH_TIMEOUT_MS,
      });

      const audio = Buffer.from(response.data);
      if (audio.length === 0) {
        throw new TtsError('TTS_UPSTREAM', 'Azure returned an empty audio body');
      }
      this.logger.log(`Azure synthesis ok in ${Date.now() - startedAt}ms (${audio.length} bytes)`);
      return audio;
    } catch (error) {
      throw this.mapAxiosError(error);
    }
  }

  private mapAxiosError(error: unknown): TtsError {
    if (error instanceof TtsError) {
      return error;
    }

    // Narrowed structurally (not via axios.isAxiosError) so the guard works
    // across TypeScript/axios type versions.
    const err = error as { isAxiosError?: boolean; response?: { status?: number }; message?: string } | null;
    if (err?.isAxiosError) {
      const status = err.response?.status;
      this.logger.warn(`Azure synthesis failed (status=${status ?? 'network'}): ${err.message ?? 'unknown'}`);
      if (status === 401) {
        return new TtsError('TTS_AUTH', 'Azure rejected the subscription key');
      }
      if (status === 403) {
        return new TtsError('TTS_FORBIDDEN', 'Azure refused the operation');
      }
      if (status === 429) {
        return new TtsError('TTS_QUOTA', 'Azure rate limit or quota exceeded');
      }
      if (status != null && status >= 400 && status < 500) {
        return new TtsError('TTS_INVALID_REQUEST', 'Azure rejected the SSML request');
      }
      return new TtsError('TTS_UPSTREAM', 'Azure service unavailable or timed out');
    }

    this.logger.error(`Unexpected synthesis error: ${error instanceof Error ? error.message : String(error)}`);
    return new TtsError('TTS_UPSTREAM', 'Unexpected synthesis failure');
  }
}
