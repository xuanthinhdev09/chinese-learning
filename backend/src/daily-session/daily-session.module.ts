import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpacedRepetitionModule } from '../spaced-repetition/spaced-repetition.module';
import { DailySessionController } from './daily-session.controller';
import { DailySessionService } from './daily-session.service';

@Module({
  imports: [PrismaModule, SpacedRepetitionModule],
  controllers: [DailySessionController],
  providers: [DailySessionService],
  exports: [DailySessionService],
})
export class DailySessionModule {}
