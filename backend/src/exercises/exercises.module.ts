import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { ExerciseMediaStorage } from './exercise-media.storage';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExercisesController],
  providers: [ExercisesService, ExerciseMediaStorage],
  exports: [ExercisesService],
})
export class ExercisesModule {}
