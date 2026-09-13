import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ValidationService } from './validators/validation.service';
import { TextbookV2Importer } from './textbook-v2/textbook-v2.importer';

@Module({
  controllers: [ImportController],
  providers: [
    ImportService,
    ValidationService,
    TextbookV2Importer,
    // scripts pass a raw PrismaClient; in the app it aliases the global PrismaService
    { provide: PrismaClient, useExisting: PrismaService },
  ],
  exports: [ImportService, ValidationService],
})
export class ImportModule {}
