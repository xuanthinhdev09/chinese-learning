import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HskModule } from './hsk/hsk.module';
import { LessonsModule } from './lessons/lessons.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { SpacedRepetitionModule } from './spaced-repetition/spaced-repetition.module';
import { DeploymentModule } from './deployment/deployment.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    HskModule,
    LessonsModule,
    VocabularyModule,
    SpacedRepetitionModule,
    DeploymentModule,
    ImportModule,
  ],
})
export class AppModule {}
