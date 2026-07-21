import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportLessonsDto } from './dto/import-lessons.dto';
import { ImportVocabulariesDto } from './dto/import-vocabularies.dto';
import { ImportConversationsDto } from './dto/import-conversations.dto';
import { memoryStorage } from 'multer';

// Multer file type definition
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('lessons')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async importLessons(@Body() dto: ImportLessonsDto) {
    try {
      return await this.importService.importLessons(dto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Import failed',
        error: error.message
      });
    }
  }

  @Post('vocabularies')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async importVocabularies(@Body() dto: ImportVocabulariesDto) {
    try {
      return await this.importService.importVocabularies(dto, dto.lesson_mapping);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Import failed',
        error: error.message
      });
    }
  }

  @Post('conversations')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async importConversations(@Body() dto: ImportConversationsDto) {
    try {
      return await this.importService.importConversations(dto, dto.lesson_mapping, dto.vocab_mapping);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Import failed',
        error: error.message
      });
    }
  }

  @Get('mappings/:hskLevel')
  async getMappings(@Param('hskLevel') hskLevel: string) {
    try {
      const level = parseInt(hskLevel, 10);
      if (isNaN(level) || level < 1 || level > 6) {
        throw new BadRequestException('Invalid HSK level (must be 1-6)');
      }
      return await this.importService.getMappings(level);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to retrieve mappings',
        error: error.message
      });
    }
  }

  @Get('status/:jobId')
  async getImportStatus(@Param('jobId') jobId: string) {
    return this.importService.getJobStatus(jobId);
  }

  // File upload endpoints (optional alternative to JSON body)
  @Post('upload/lessons')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB
    })
  )
  async uploadLessons(@UploadedFile() file: MulterFile) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const json = JSON.parse(file.buffer.toString('utf-8'));
      return await this.importService.importLessons(json);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to parse uploaded file',
        error: error.message
      });
    }
  }

  @Post('upload/vocabularies')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB
    })
  )
  async uploadVocabularies(
    @UploadedFile() file: MulterFile,
    @Body('lesson_mapping') lessonMappingStr?: string
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const dto = JSON.parse(file.buffer.toString('utf-8'));
      const lessonMapping = lessonMappingStr
        ? JSON.parse(lessonMappingStr)
        : undefined;

      return await this.importService.importVocabularies(dto, lessonMapping);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to parse uploaded file',
        error: error.message
      });
    }
  }

  @Post('upload/conversations')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB
    })
  )
  async uploadConversations(
    @UploadedFile() file: MulterFile,
    @Body('lesson_mapping') lessonMappingStr: string,
    @Body('vocab_mapping') vocabMappingStr: string
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const dto = JSON.parse(file.buffer.toString('utf-8'));
      const lessonMapping = JSON.parse(lessonMappingStr);
      const vocabMapping = JSON.parse(vocabMappingStr);

      return await this.importService.importConversations(dto, lessonMapping, vocabMapping);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to parse uploaded file',
        error: error.message
      });
    }
  }
}
