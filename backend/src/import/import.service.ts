import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportLessonsDto } from './dto/import-lessons.dto';
import { ImportVocabulariesDto } from './dto/import-vocabularies.dto';
import { ImportConversationsDto } from './dto/import-conversations.dto';
import { IdMappingResponseDto } from './dto/id-mapping-response.dto';
import { ImportSummaryResponseDto } from './dto/import-summary-response.dto';
import { ValidationService } from './validators/validation.service';
import { LessonMapper } from './mappers/lesson.mapper';
import { VocabularyMapper } from './mappers/vocabulary.mapper';
import { ConversationMapper } from './mappers/conversation.mapper';

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private validator: ValidationService
  ) {}

  /**
   * Import lessons and return slug -> CUID mapping
   */
  async importLessons(dto: ImportLessonsDto): Promise<IdMappingResponseDto> {
    // Step 1: Validate
    const validation = this.validator.validateLessons(dto);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.validator.formatErrors(validation.errors)
      });
    }

    const errors: string[] = [];
    const mapping: Record<string, string> = {};
    let createdCount = 0;
    let skippedCount = 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        // Get or create HSK level
        const hskLevel = await tx.hskLevel.upsert({
          where: { level: dto.hsk_level },
          update: {},
          create: {
            level: dto.hsk_level,
            name: `HSK ${dto.hsk_level}`,
            description: dto.hsk_version || `Imported via JSON`
          }
        });

        for (const lesson of dto.lessons) {
          const slug = LessonMapper.generateSlug(lesson.order, dto.hsk_level);

          // Check if exists
          const existing = await tx.lesson.findFirst({
            where: {
              hskLevelId: hskLevel.id,
              order: lesson.order
            }
          });

          if (existing) {
            mapping[slug] = existing.id;
            skippedCount++;
            continue;
          }

          // Create new
          const created = await tx.lesson.create({
            data: LessonMapper.toCreateDto(lesson, hskLevel.id)
          });

          mapping[slug] = created.id;
          createdCount++;
        }
      });
    } catch (error) {
      throw new BadRequestException({
        message: 'Transaction failed',
        error: error.message
      });
    }

    return {
      success: true,
      hsk_level: dto.hsk_level,
      created_count: createdCount,
      skipped_count: skippedCount,
      errors,
      mapping,
      exported_at: new Date().toISOString()
    };
  }

  /**
   * Import vocabularies using lesson mapping
   */
  async importVocabularies(
    dto: ImportVocabulariesDto,
    lessonMapping?: Record<string, string>
  ): Promise<IdMappingResponseDto> {
    // Step 1: Validate lesson mapping provided
    if (!lessonMapping || Object.keys(lessonMapping).length === 0) {
      throw new BadRequestException({
        message: 'lesson_mapping is required for vocabulary import'
      });
    }

    // Step 2: Validate DTO
    const validation = this.validator.validateVocabularies(dto, lessonMapping);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.validator.formatErrors(validation.errors)
      });
    }

    const errors: string[] = [];
    const mapping: Record<string, string> = {};
    let createdCount = 0;
    let skippedCount = 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const vocab of dto.vocabularies) {
          // Resolve lessonId
          const lessonId = lessonMapping[vocab.lesson_slug];
          if (!lessonId) {
            errors.push(`Unknown lesson_slug: ${vocab.lesson_slug} at index ${dto.vocabularies.indexOf(vocab)}`);
            continue;
          }

          // Extract lesson order from slug for vocabulary slug generation
          const lessonOrder = parseInt(vocab.lesson_slug.split('-')[2], 10);

          // Check if exists
          const existing = await tx.vocabulary.findFirst({
            where: {
              lessonId,
              hanzi: vocab.hanzi
            }
          });

          const slug = VocabularyMapper.generateSlug(vocab.hanzi, lessonOrder);

          if (existing) {
            mapping[slug] = existing.id;
            skippedCount++;
            continue;
          }

          // Create new
          const created = await tx.vocabulary.create({
            data: VocabularyMapper.toCreateDto(vocab, lessonId, dto.hsk_level)
          });

          mapping[slug] = created.id;
          createdCount++;
        }
      });
    } catch (error) {
      throw new BadRequestException({
        message: 'Transaction failed',
        error: error.message
      });
    }

    return {
      success: errors.length === 0,
      hsk_level: dto.hsk_level,
      created_count: createdCount,
      skipped_count: skippedCount,
      errors,
      mapping,
      exported_at: new Date().toISOString()
    };
  }

  /**
   * Import conversations using both lesson and vocabulary mappings
   */
  async importConversations(
    dto: ImportConversationsDto,
    lessonMapping?: Record<string, string>,
    vocabMapping?: Record<string, string>
  ): Promise<ImportSummaryResponseDto> {
    // Step 1: Validate mappings
    if (!lessonMapping || !vocabMapping) {
      throw new BadRequestException({
        message: 'Both lesson_mapping and vocab_mapping are required'
      });
    }

    // Step 2: Validate DTO
    const validation = this.validator.validateConversations(dto, lessonMapping, vocabMapping);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.validator.formatErrors(validation.errors)
      });
    }

    const errors: string[] = [];
    let createdCount = 0;
    let skippedCount = 0;
    let vocabLinkCount = 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const conv of dto.conversations) {
          // Resolve lessonId
          const lessonId = lessonMapping[conv.lesson_slug];
          if (!lessonId) {
            errors.push(`Unknown lesson_slug: ${conv.lesson_slug}`);
            continue;
          }

          // Check for existing conversation
          const existing = await tx.conversation.findFirst({
            where: {
              lessonId,
              order: conv.order
            }
          });

          let conversationId: string;

          if (existing) {
            conversationId = existing.id;
            skippedCount++;
          } else {
            // Create conversation
            const created = await tx.conversation.create({
              data: ConversationMapper.toCreateDto(conv, lessonId)
            });
            conversationId = created.id;
            createdCount++;
          }

          // Create vocabulary links
          const vocabLinkDtos = ConversationMapper.toConversationVocabCreateDtos(
            conversationId,
            conv.vocabularies,
            vocabMapping
          );

          // Create links (avoid duplicates with unique constraint)
          for (const linkDto of vocabLinkDtos) {
            if (!linkDto.vocabularyId) {
              errors.push(`Missing vocabularyId for vocab_slug in conversation at order ${conv.order}`);
              continue;
            }

            const existingLink = await tx.conversationVocabulary.findUnique({
              where: {
                conversationId_vocabularyId: {
                  conversationId: linkDto.conversationId,
                  vocabularyId: linkDto.vocabularyId
                }
              }
            });

            if (!existingLink) {
              await tx.conversationVocabulary.create({
                data: linkDto
              });
              vocabLinkCount++;
            }
          }
        }
      });
    } catch (error) {
      throw new BadRequestException({
        message: 'Transaction failed',
        error: error.message
      });
    }

    return {
      success: errors.length === 0,
      hsk_level: dto.hsk_level,
      import_type: 'conversations',
      total_records: dto.conversations.length,
      created_count: createdCount,
      skipped_count: skippedCount,
      failed_count: errors.length,
      errors,
      imported_at: new Date().toISOString()
    };
  }

  /**
   * Get job status (placeholder for Phase 5)
   */
  async getJobStatus(jobId: string) {
    return {
      jobId,
      status: 'pending',
      message: 'TODO: Implement job tracking in Phase 5'
    };
  }

  /**
   * Get existing mappings for an HSK level
   */
  async getMappings(hskLevel: number): Promise<{
    lessons: Record<string, string>;
    vocabularies: Record<string, string>;
  }> {
    const lessons: Record<string, string> = {};
    const vocabularies: Record<string, string> = {};

    // Get HSK level
    const hsk = await this.prisma.hskLevel.findUnique({
      where: { level: hskLevel }
    });

    if (!hsk) {
      throw new BadRequestException(`HSK level ${hskLevel} not found`);
    }

    // Get all lessons for this HSK level
    const lessonRecords = await this.prisma.lesson.findMany({
      where: { hskLevelId: hsk.id },
      orderBy: { order: 'asc' }
    });

    // Build lesson mapping
    lessonRecords.forEach(lesson => {
      const slug = LessonMapper.generateSlug(lesson.order, hskLevel);
      lessons[slug] = lesson.id;
    });

    // Get all vocabularies for these lessons
    const vocabRecords = await this.prisma.vocabulary.findMany({
      where: {
        lessonId: { in: lessonRecords.map(l => l.id) }
      }
    });

    // Build vocab mapping
    vocabRecords.forEach(vocab => {
      // Find which lesson this vocab belongs to
      const lesson = lessonRecords.find(l => l.id === vocab.lessonId);
      if (lesson) {
        const slug = VocabularyMapper.generateSlug(vocab.hanzi, lesson.order);
        vocabularies[slug] = vocab.id;
      }
    });

    return {
      lessons,
      vocabularies
    };
  }
}
