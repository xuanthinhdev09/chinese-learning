import { BadRequestException } from '@nestjs/common';
import { JsonV2Validator } from './validators/json-v2.validator';
import { JsonV2Mapper } from './mappers/json-v2.mapper';
import { TextbookV2Importer } from './textbook-v2/textbook-v2.importer';
import { ImportTextbookV2Dto } from './dto/import-textbook-v2.dto';

const VALID_V2: ImportTextbookV2Dto = {
  course: { name: 'Sách của tôi', type: 'CUSTOM' },
  lessons: [
    {
      title: 'Bài 1',
      order: 1,
      vocabulary: [
        { hanzi: '你好', pinyin: 'nǐ hǎo', vietnamese: 'Xin chào', is_keyword: true },
        { hanzi: '谢谢', pinyin: 'xiè xie', vietnamese: 'Cảm ơn' },
      ],
      conversations: [
        { order: 1, speaker: '明明', hanzi: '你好！', pinyin: 'nǐ hǎo!', vietnamese: 'Xin chào!' },
      ],
    },
  ],
};

describe('JsonV2Validator', () => {
  it('accepts a well-formed v2 payload', () => {
    const result = JsonV2Validator.validate(VALID_V2);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('requires a course block and at least one lesson', () => {
    const result = JsonV2Validator.validate({ lessons: [] });
    expect(result.valid).toBe(false);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain('course');
    expect(fields).toContain('lessons');
  });

  it('rejects HSK courses without a valid level', () => {
    const result = JsonV2Validator.validate({
      course: { name: 'HSK 2', type: 'HSK' },
      lessons: VALID_V2.lessons,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'course.level')).toBe(true);
  });

  it('lists per-item errors for missing pinyin and duplicate conversation orders', () => {
    const result = JsonV2Validator.validate({
      course: { name: 'X', type: 'CUSTOM' },
      lessons: [
        {
          title: 'Bài 1',
          order: 1,
          vocabulary: [{ hanzi: '猫', pinyin: '', vietnamese: 'Mèo' }],
          conversations: [
            { order: 1, hanzi: 'A', pinyin: 'a', vietnamese: 'A' },
            { order: 1, hanzi: 'B', pinyin: 'b', vietnamese: 'B' },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field.includes('vocabulary[0].pinyin'))).toBe(true);
    expect(result.errors.some((e) => e.field.includes('conversations[1].order'))).toBe(true);
  });

  it('warns on pinyin without tone marks and missing meaning without failing', () => {
    const result = JsonV2Validator.validate({
      course: { name: 'X', type: 'CUSTOM' },
      lessons: [
        {
          title: 'Bài 1',
          order: 1,
          vocabulary: [{ hanzi: '猫', pinyin: 'mao' }],
          conversations: [],
        },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.field.includes('pinyin'))).toBe(true);
    expect(result.warnings.some((w) => w.field.includes('meaning'))).toBe(true);
  });

  it('ignores extra extraction meta fields', () => {
    const payload = {
      ...VALID_V2,
      source_pages: { pdf: [1, 2] },
      lessons: [{ ...VALID_V2.lessons[0], source_pages: { pdf: [3] } }],
    };
    expect(JsonV2Validator.validate(payload).valid).toBe(true);
  });
});

describe('JsonV2Mapper', () => {
  it('maps vietnamese gloss into meaning and keeps keyword flag', () => {
    const created = JsonV2Mapper.toVocabularyCreate(VALID_V2.lessons[0].vocabulary[0], 'l1', null);
    expect(created).toMatchObject({
      lessonId: 'l1',
      hanzi: '你好',
      meaning: 'Xin chào',
      isKeyword: true,
      hskLevel: null,
    });
  });

  it('defaults CUSTOM course level to 0 and requires HSK level', () => {
    expect(JsonV2Mapper.toCourseCreate({ name: 'Sách', type: 'CUSTOM' }).level).toBe(0);
    expect(JsonV2Mapper.toCourseCreate({ name: 'HSK 3', type: 'HSK', level: 3 }).level).toBe(3);
  });

  it('maps conversation speaker', () => {
    const conv = JsonV2Mapper.toConversationCreate(VALID_V2.lessons[0].conversations[0], 'l1');
    expect(conv).toMatchObject({ lessonId: 'l1', speaker: '明明', order: 1 });
  });
});

describe('TextbookV2Importer', () => {
  function buildImporterMock() {
    const tx = {
      lesson: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'l-new', ...data })),
      },
      vocabulary: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'v-new', ...data })),
        update: jest.fn().mockResolvedValue({}),
      },
      conversation: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
      course: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'c-new', ...data })),
      },
      lesson: { findUnique: jest.fn() },
    };
    return { tx, prisma, importer: new TextbookV2Importer(prisma as never) };
  }

  it('creates a CUSTOM course and imports lessons, vocab, and conversations', async () => {
    const { tx, prisma, importer } = buildImporterMock();

    const result = await importer.importTextbookV2(VALID_V2);

    expect(result.success).toBe(true);
    expect(prisma.course.create).toHaveBeenCalled();
    expect(tx.lesson.create).toHaveBeenCalledTimes(1);
    expect(tx.vocabulary.create).toHaveBeenCalledTimes(2);
    expect(tx.conversation.deleteMany).toHaveBeenCalledWith({ where: { lessonId: 'l-new' } });
    expect(tx.conversation.createMany).toHaveBeenCalledTimes(1);
    expect(result.keywords_flagged).toBe(1);
    expect(result.conversations_replaced).toBe(1);
  });

  it('is idempotent: existing lessons are kept and existing vocab is updated', async () => {
    const { tx, prisma, importer } = buildImporterMock();
    prisma.course.findFirst.mockResolvedValue({ id: 'c-existing', name: 'Sách của tôi', type: 'CUSTOM', level: 0 });
    tx.lesson.findFirst.mockResolvedValue({ id: 'l-existing', title: 'Bài 1', order: 1 });
    tx.vocabulary.findFirst
      .mockResolvedValueOnce({ id: 'v1', isKeyword: false })
      .mockResolvedValueOnce({ id: 'v2', isKeyword: true });

    const result = await importer.importTextbookV2(VALID_V2);

    expect(result.created_lessons).toBe(0);
    expect(result.skipped_lessons).toBe(1);
    expect(tx.lesson.create).not.toHaveBeenCalled();
    expect(tx.vocabulary.create).not.toHaveBeenCalled();
    expect(tx.vocabulary.update).toHaveBeenCalledTimes(2);
    expect(result.vocab_created).toBe(0);
    expect(result.vocab_updated).toBe(2);
  });

  it('throws a validation error listing per-item problems instead of importing', async () => {
    const { prisma, importer } = buildImporterMock();

    await expect(
      importer.importTextbookV2({
        course: { name: 'HSK 2', type: 'HSK' },
        lessons: VALID_V2.lessons,
      })
    ).rejects.toThrow(BadRequestException);

    expect(prisma.course.findFirst).not.toHaveBeenCalled();
  });
});
