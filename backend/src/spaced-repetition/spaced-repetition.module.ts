import { Module } from '@nestjs/common';
import { SpacedRepetitionController } from './spaced-repetition.controller';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SpacedRepetitionController],
  providers: [SpacedRepetitionService],
  exports: [SpacedRepetitionService],
})
export class SpacedRepetitionModule {}
