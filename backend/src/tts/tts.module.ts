import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { TtsController } from './tts.controller';
import { TtsCacheService } from './tts-cache.service';
import { LocalTtsStorage } from './tts-storage.service';
import { AzureRestTtsProvider } from './providers/azure-rest.provider';
import { TTS_PROVIDER } from './tts.provider-token';
import { TTS_STORAGE } from './tts.storage-token';

@Module({
  controllers: [TtsController],
  providers: [
    TtsService,
    TtsCacheService,
    { provide: TTS_PROVIDER, useClass: AzureRestTtsProvider },
    { provide: TTS_STORAGE, useClass: LocalTtsStorage },
  ],
  exports: [TtsService, TTS_PROVIDER, TTS_STORAGE],
})
export class TtsModule {}
