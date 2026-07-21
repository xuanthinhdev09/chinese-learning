import { LessonItemDto } from '../dto/import-lessons.dto';

export interface LessonValidationError {
  index: number;
  field: string;
  message: string;
}

export class LessonsValidator {
  /**
   * Validate lessons array for duplicates and sequence integrity
   */
  static validate(lessons: LessonItemDto[]): LessonValidationError[] {
    const errors: LessonValidationError[] = [];

    if (!lessons || lessons.length === 0) {
      errors.push({
        index: -1,
        field: 'lessons',
        message: 'Lessons array cannot be empty'
      });
      return errors;
    }

    // Check duplicate orders
    const orders = new Set<number>();
    lessons.forEach((lesson, index) => {
      if (orders.has(lesson.order)) {
        errors.push({
          index,
          field: 'order',
          message: `Duplicate order ${lesson.order} at index ${index}`
        });
      }
      orders.add(lesson.order);
    });

    // Check order sequence (must start at 1 and be sequential)
    const sortedOrders = Array.from(orders).sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        errors.push({
          index: -1,
          field: 'order',
          message: `Lesson orders must be sequential starting from 1. Found gap at position ${i + 1}`
        });
        break;
      }
    }

    // Check for duplicate titles
    const titles = new Set<string>();
    lessons.forEach((lesson, index) => {
      if (titles.has(lesson.title)) {
        errors.push({
          index,
          field: 'title',
          message: `Duplicate title "${lesson.title}" at index ${index}`
        });
      }
      titles.add(lesson.title);
    });

    return errors;
  }

  /**
   * Validate that order numbers are unique across the array
   */
  static validateUniqueOrders(lessons: LessonItemDto[]): LessonValidationError[] {
    const errors: LessonValidationError[] = [];
    const orderMap = new Map<number, number[]>();

    lessons.forEach((lesson, index) => {
      if (!orderMap.has(lesson.order)) {
        orderMap.set(lesson.order, []);
      }
      orderMap.get(lesson.order)!.push(index);
    });

    orderMap.forEach((indices, order) => {
      if (indices.length > 1) {
        indices.forEach(index => {
          errors.push({
            index,
            field: 'order',
            message: `Duplicate order ${order} found at indices ${indices.join(', ')}`
          });
        });
      }
    });

    return errors;
  }
}
