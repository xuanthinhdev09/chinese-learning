import { LessonItemDto } from '../dto/import-lessons.dto';

export class LessonMapper {
  /**
   * Generate slug for lesson: "lesson-order-{n}"
   */
  static generateSlug(order: number, hskLevel: number): string {
    return `lesson-order-${order}`;
  }

  /**
   * Convert DTO to Prisma create input
   */
  static toCreateDto(lesson: LessonItemDto, hskLevelId: string) {
    return {
      hskLevelId,
      title: lesson.title,
      description: lesson.description || null,
      order: lesson.order
    };
  }
}
