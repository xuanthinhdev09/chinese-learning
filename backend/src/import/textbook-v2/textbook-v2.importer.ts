import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  ImportTextbookV2Dto,
  TextbookV2CourseDto,
  TextbookV2ImportResult,
  TextbookV2LessonImportSummary,
} from '../dto/import-textbook-v2.dto';
import { JsonV2Issue, JsonV2Validator } from '../validators/json-v2.validator';
import { JsonV2Mapper } from '../mappers/json-v2.mapper';

/**
 * Core v2 import orchestration. Idempotent per file:
 * - course resolved by identity (CUSTOM: name; HSK: level)
 * - lesson resolved by (courseId, order); existing lessons keep their id
 * - vocabulary upserted by (lessonId, hanzi); re-import refreshes content
 * - conversations replaced wholesale per lesson (no per-line user data exists;
 *   UserDialogueProgress is lesson-level and survives re-import)
 */
@Injectable()
export class TextbookV2Importer {
  // PrismaClient typing lets scripts pass a quiet raw client; Nest injects
  // PrismaService (a PrismaClient subclass) via useExisting in ImportModule
  constructor(private readonly prisma: PrismaClient) {}

  async importTextbookV2(dto: ImportTextbookV2Dto): Promise<TextbookV2ImportResult> {
    const validation = JsonV2Validator.validate(dto);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.formatIssues(validation.errors),
        warnings: this.formatIssues(validation.warnings),
      });
    }

    const course = await this.resolveCourse(dto.course);

    let createdLessons = 0;
    let skippedLessons = 0;
    let vocabCreated = 0;
    let vocabUpdated = 0;
    let keywordsFlagged = 0;
    let conversationsReplaced = 0;
    const lessonSummaries: TextbookV2LessonImportSummary[] = [];

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const [lessonIndex, lesson] of dto.lessons.entries()) {
          let dbLesson = await tx.lesson.findFirst({
            where: { courseId: course.id, order: lesson.order },
          });
          if (dbLesson) {
            skippedLessons++;
          } else {
            dbLesson = await tx.lesson.create({
              data: JsonV2Mapper.toLessonCreate(lesson, course.id),
            });
            createdLessons++;
          }

          let lessonVocabCreated = 0;
          let lessonVocabUpdated = 0;
          let lessonKeywords = 0;

          for (const vocab of lesson.vocabulary || []) {
            const isKeyword = vocab.is_keyword === true;
            const existing = await tx.vocabulary.findFirst({
              where: { lessonId: dbLesson.id, hanzi: vocab.hanzi },
            });

            if (existing) {
              await tx.vocabulary.update({
                where: { id: existing.id },
                data: JsonV2Mapper.toVocabularyUpdate(vocab),
              });
              lessonVocabUpdated++;
              if (isKeyword && !existing.isKeyword) lessonKeywords++;
            } else {
              await tx.vocabulary.create({
                data: JsonV2Mapper.toVocabularyCreate(
                  vocab,
                  dbLesson.id,
                  course.type === 'HSK' ? course.level : null
                ),
              });
              lessonVocabCreated++;
              if (isKeyword) lessonKeywords++;
            }
          }

          // Replace dialogue lines: re-import refreshes conversations
          await tx.conversation.deleteMany({ where: { lessonId: dbLesson.id } });
          if ((lesson.conversations || []).length > 0) {
            await tx.conversation.createMany({
              data: (lesson.conversations || []).map((conv) =>
                JsonV2Mapper.toConversationCreate(conv, dbLesson.id)
              ),
            });
          }

          vocabCreated += lessonVocabCreated;
          vocabUpdated += lessonVocabUpdated;
          keywordsFlagged += lessonKeywords;
          conversationsReplaced += (lesson.conversations || []).length;

          lessonSummaries.push({
            order: lesson.order,
            title: lesson.title,
            lesson_id: dbLesson.id,
            vocab_created: lessonVocabCreated,
            vocab_updated: lessonVocabUpdated,
            keywords: lessonKeywords,
            conversations_replaced: (lesson.conversations || []).length,
          });
        }
      });
    } catch (error) {
      throw new BadRequestException({
        message: 'Transaction failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      success: true,
      course_id: course.id,
      course_name: course.name,
      course_type: course.type,
      created_lessons: createdLessons,
      skipped_lessons: skippedLessons,
      vocab_created: vocabCreated,
      vocab_updated: vocabUpdated,
      keywords_flagged: keywordsFlagged,
      conversations_replaced: conversationsReplaced,
      lessons: lessonSummaries,
      warnings: this.formatIssues(validation.warnings),
      errors: [],
      imported_at: new Date().toISOString(),
    };
  }

  private async resolveCourse(course: TextbookV2CourseDto) {
    const where: Prisma.CourseWhereInput =
      course.type === 'CUSTOM'
        ? { type: 'CUSTOM', name: course.name }
        : { type: 'HSK', level: course.level };

    const existing = await this.prisma.course.findFirst({ where });
    if (existing) {
      return existing;
    }
    return this.prisma.course.create({ data: JsonV2Mapper.toCourseCreate(course) });
  }

  private formatIssues(issues: JsonV2Issue[]): string[] {
    return issues.map((issue) => {
      const at = issue.lessonIndex >= 0 ? `[Lesson ${issue.lessonIndex + 1}]` : '[Course]';
      return `${at} ${issue.field}: ${issue.message}`;
    });
  }
}
