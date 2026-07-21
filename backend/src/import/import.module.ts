import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ValidationService } from './validators/validation.service';

@Module({
  controllers: [ImportController],
  providers: [ImportService, ValidationService],
  exports: [ImportService, ValidationService],
})
export class ImportModule {}
