import { Module } from '@nestjs/common';
import { HskController } from './hsk.controller';
import { HskService } from './hsk.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HskController],
  providers: [HskService],
  exports: [HskService],
})
export class HskModule {}