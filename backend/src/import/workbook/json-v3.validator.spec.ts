import {
  JsonV3LessonDoc,
  collectPayloadRefs,
  validateJsonV3,
} from './json-v3.validator';

/** Minimal valid doc mirroring extracted-wb/lesson-01.json shape. */
function validDoc(): JsonV3LessonDoc {
  return {
    _meta: { format: 'workbook-json-v3' },
    lesson: { order: 1, book_page: 7 },
    exercises: [
      {
        order: 1,
        section: '听力',
        typeCode: 'listen_judge_picture_tf',
        instructionHanzi: '第1-5题:听句子,判断对错',
        instructionVi: 'Nghe câu, đánh dấu đúng/sai',
        source_page: 7,
        payload: {
          audioFile: '01-1.mp3',
          example: [{ hanzi: '我们家有三个人。', imageRef: 'p07-crop-1', answer: '√' }],
          items: [
            { label: '1', imageRef: 'p07-crop-3', answer: '√' },
            { label: '2', imageRef: 'p07-crop-4', answer: 'X' },
          ],
        },
      },
      {
        order: 2,
        section: '阅读',
        typeCode: 'read_fill_blank_word',
        payload: {
          options: [{ letter: 'A', hanzi: '为什么' }],
          items: [{ label: '21', hanzi: '王方( )买一个新杯子。', answer: 'B' }],
        },
      },
    ],
    images: [
      { ref: 'p07-crop-1', page: 7, file: 'lesson-01/p07-crop-1.png' },
      { ref: 'p07-crop-3', page: 7, file: 'lesson-01/p07-crop-3.png' },
      { ref: 'p07-crop-4', page: 7, file: 'lesson-01/p07-crop-4.png' },
    ],
  };
}

describe('validateJsonV3', () => {
  it('accepts the pilot lesson-01 shaped document', () => {
    expect(validateJsonV3(validDoc())).toEqual([]);
  });

  it('rejects wrong _meta.format', () => {
    const doc = validDoc();
    doc._meta.format = 'v2';
    expect(validateJsonV3(doc)).toContainEqual('_meta.format: expected "workbook-json-v3"');
  });

  it('rejects non-contiguous exercise orders', () => {
    const doc = validDoc();
    doc.exercises[1].order = 5;
    const errors = validateJsonV3(doc);
    expect(errors).toContainEqual('exercises: order 2 missing (must be contiguous 1..N)');
  });

  it('rejects unknown section and typeCode', () => {
    const doc = validDoc();
    doc.exercises[0].section = '写作';
    doc.exercises[0].typeCode = 'write_essay';
    const errors = validateJsonV3(doc);
    expect(errors.some((e) => e.startsWith('exercises[0].section'))).toBe(true);
    expect(errors.some((e) => e.startsWith('exercises[0].typeCode'))).toBe(true);
  });

  it('requires audioFile on listening types only', () => {
    const doc = validDoc();
    // remove audio from listening exercise 1
    delete (doc.exercises[0].payload as { audioFile?: string }).audioFile;
    let errors = validateJsonV3(doc);
    expect(errors.some((e) => e.includes('audioFile'))).toBe(true);
    // and an audioFile on a non-audio type is NOT flagged
    (doc.exercises[1].payload as { audioFile?: string }).audioFile = '01-2.mp3';
    errors = validateJsonV3(doc);
    expect(errors.some((e) => e.startsWith('exercises[1].payload.audioFile'))).toBe(false);
  });

  it('requires drillType on listen_repeat_drill', () => {
    const doc = validDoc();
    doc.exercises[0].typeCode = 'listen_repeat_drill';
    doc.exercises[0].payload.items = [{ label: '(1)', hanzi: '好吃', pinyin: 'hǎochī' }];
    const errors = validateJsonV3(doc);
    expect(errors.some((e) => e.includes('drillType'))).toBe(true);
  });

  it('requires an answer on every item of gradable types', () => {
    const doc = validDoc();
    delete (doc.exercises[1].payload.items[0] as { answer?: string }).answer;
    const errors = validateJsonV3(doc);
    expect(errors.some((e) => e.includes('every item needs an answer'))).toBe(true);
  });

  it('flags payload refs missing from images[] and orphan images', () => {
    const doc = validDoc();
    doc.images = doc.images.filter((im) => im.ref !== 'p07-crop-4');
    doc.images.push({ ref: 'p99-crop-9', page: 99, file: 'lesson-01/p99-crop-9.png' });
    const errors = validateJsonV3(doc);
    expect(errors).toContainEqual('payload refs "p07-crop-4" missing from images[]');
    expect(errors).toContainEqual('images[] "p99-crop-9" not referenced by any exercise');
  });

  it('rejects image files outside the lesson directory', () => {
    const doc = validDoc();
    doc.images[0].file = 'lesson-02/p07-crop-1.png';
    const errors = validateJsonV3(doc);
    expect(errors.some((e) => e.includes('must live under lesson-01/'))).toBe(true);
  });
});

describe('collectPayloadRefs', () => {
  it('finds refs in options pools and nested item fields', () => {
    const refs = collectPayloadRefs({
      options: ['p08-crop-1', 'p08-crop-2'],
      items: [{ label: '6', imageRef: 'p07-crop-3', answer: 'B' }],
      example: [{ imageRef: 'p07-crop-1', answer: '√' }],
    });
    expect(refs.sort()).toEqual(['p07-crop-1', 'p07-crop-3', 'p08-crop-1', 'p08-crop-2']);
  });

  it('ignores non-ref strings (pinyin options)', () => {
    const refs = collectPayloadRefs({
      items: [{ label: '(1)', options: ['shíjiān', 'shíhou'], answer: '1' }],
    });
    expect(refs).toEqual([]);
  });
});
