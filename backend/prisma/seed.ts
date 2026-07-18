import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create HSK levels
  const hsk1 = await prisma.hskLevel.upsert({
    where: { level: 1 },
    update: {},
    create: {
      level: 1,
      name: 'HSK 1',
      description: 'Cơ bản - 150 từ vựng',
    },
  });

  const hsk2 = await prisma.hskLevel.upsert({
    where: { level: 2 },
    update: {},
    create: {
      level: 2,
      name: 'HSK 2',
      description: 'Sơ cấp - 300 từ vựng',
    },
  });

  // Create HSK 1 lessons
  const lesson1_1 = await prisma.lesson.upsert({
    where: {
      id: 'hsk1-lesson-1',
    },
    update: {},
    create: {
      id: 'hsk1-lesson-1',
      hskLevelId: hsk1.id,
      title: 'Bài 1: Xin chào (你好)',
      description: 'Học cách chào hỏi và giới thiệu bản thân',
      order: 1,
    },
  });

  const lesson1_2 = await prisma.lesson.upsert({
    where: { id: 'hsk1-lesson-2' },
    update: {},
    create: {
      id: 'hsk1-lesson-2',
      hskLevelId: hsk1.id,
      title: 'Bài 2: Số đếm (数字)',
      description: 'Học các số từ 1 đến 10',
      order: 2,
    },
  });

  const lesson1_3 = await prisma.lesson.upsert({
    where: { id: 'hsk1-lesson-3' },
    update: {},
    create: {
      id: 'hsk1-lesson-3',
      hskLevelId: hsk1.id,
      title: 'Bài 3: Gia đình (家庭)',
      description: 'Học từ vựng về gia đình',
      order: 3,
    },
  });

  // Create HSK 2 lessons
  const lesson2_1 = await prisma.lesson.upsert({
    where: { id: 'hsk2-lesson-1' },
    update: {},
    create: {
      id: 'hsk2-lesson-1',
      hskLevelId: hsk2.id,
      title: 'Bài 1: Thời gian (时间)',
      description: 'Học cách nói về thời gian',
      order: 1,
    },
  });

  const lesson2_2 = await prisma.lesson.upsert({
    where: { id: 'hsk2-lesson-2' },
    update: {},
    create: {
      id: 'hsk2-lesson-2',
      hskLevelId: hsk2.id,
      title: 'Bài 2: Ngày tháng (日期)',
      description: 'Học ngày tháng và năm',
      order: 2,
    },
  });

  // Create vocabularies for Lesson 1.1 (Greetings)
  await prisma.vocabulary.createMany({
    data: [
      {
        id: 'vocab-1-1',
        lessonId: lesson1_1.id,
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        meaning: 'Xin chào',
        wordType: 'phrase',
        example: '你好吗？(Nǐ hǎo ma?) - Bạn khỏe không?',
      },
      {
        id: 'vocab-1-2',
        lessonId: lesson1_1.id,
        hanzi: '我',
        pinyin: 'wǒ',
        meaning: 'Tôi',
        wordType: 'pronoun',
      },
      {
        id: 'vocab-1-3',
        lessonId: lesson1_1.id,
        hanzi: '你',
        pinyin: 'nǐ',
        meaning: 'Bạn',
        wordType: 'pronoun',
      },
      {
        id: 'vocab-1-4',
        lessonId: lesson1_1.id,
        hanzi: '他',
        pinyin: 'tā',
        meaning: 'Anh ấy',
        wordType: 'pronoun',
      },
      {
        id: 'vocab-1-5',
        lessonId: lesson1_1.id,
        hanzi: '她',
        pinyin: 'tā',
        meaning: 'Cô ấy',
        wordType: 'pronoun',
      },
      {
        id: 'vocab-1-6',
        lessonId: lesson1_1.id,
        hanzi: '好',
        pinyin: 'hǎo',
        meaning: 'Tốt, khỏe',
        wordType: 'adjective',
        example: '我很好 (Wǒ hěn hǎo) - Tôi rất khỏe',
      },
      {
        id: 'vocab-1-7',
        lessonId: lesson1_1.id,
        hanzi: '再见',
        pinyin: 'zài jiàn',
        meaning: 'Tạm biệt',
        wordType: 'phrase',
      },
      {
        id: 'vocab-1-8',
        lessonId: lesson1_1.id,
        hanzi: '谢谢',
        pinyin: 'xiè xie',
        meaning: 'Cảm ơn',
        wordType: 'phrase',
      },
    ],
    skipDuplicates: true,
  });

  // Create vocabularies for Lesson 1.2 (Numbers)
  await prisma.vocabulary.createMany({
    data: [
      {
        id: 'vocab-2-1',
        lessonId: lesson1_2.id,
        hanzi: '一',
        pinyin: 'yī',
        meaning: 'Một',
        wordType: 'number',
      },
      {
        id: 'vocab-2-2',
        lessonId: lesson1_2.id,
        hanzi: '二',
        pinyin: 'èr',
        meaning: 'Hai',
        wordType: 'number',
      },
      {
        id: 'vocab-2-3',
        lessonId: lesson1_2.id,
        hanzi: '三',
        pinyin: 'sān',
        meaning: 'Ba',
        wordType: 'number',
      },
      {
        id: 'vocab-2-4',
        lessonId: lesson1_2.id,
        hanzi: '四',
        pinyin: 'sì',
        meaning: 'Bốn',
        wordType: 'number',
      },
      {
        id: 'vocab-2-5',
        lessonId: lesson1_2.id,
        hanzi: '五',
        pinyin: 'wǔ',
        meaning: 'Năm',
        wordType: 'number',
      },
      {
        id: 'vocab-2-6',
        lessonId: lesson1_2.id,
        hanzi: '六',
        pinyin: 'liù',
        meaning: 'Sáu',
        wordType: 'number',
      },
      {
        id: 'vocab-2-7',
        lessonId: lesson1_2.id,
        hanzi: '七',
        pinyin: 'qī',
        meaning: 'Bảy',
        wordType: 'number',
      },
      {
        id: 'vocab-2-8',
        lessonId: lesson1_2.id,
        hanzi: '八',
        pinyin: 'bā',
        meaning: 'Tám',
        wordType: 'number',
      },
      {
        id: 'vocab-2-9',
        lessonId: lesson1_2.id,
        hanzi: '九',
        pinyin: 'jiǔ',
        meaning: 'Chín',
        wordType: 'number',
      },
      {
        id: 'vocab-2-10',
        lessonId: lesson1_2.id,
        hanzi: '十',
        pinyin: 'shí',
        meaning: 'Mười',
        wordType: 'number',
      },
    ],
    skipDuplicates: true,
  });

  // Create vocabularies for Lesson 1.3 (Family)
  await prisma.vocabulary.createMany({
    data: [
      {
        id: 'vocab-3-1',
        lessonId: lesson1_3.id,
        hanzi: '家',
        pinyin: 'jiā',
        meaning: 'Gia đình, nhà',
        wordType: 'noun',
      },
      {
        id: 'vocab-3-2',
        lessonId: lesson1_3.id,
        hanzi: '爸爸',
        pinyin: 'bà ba',
        meaning: 'Bố',
        wordType: 'noun',
      },
      {
        id: 'vocab-3-3',
        lessonId: lesson1_3.id,
        hanzi: '妈妈',
        pinyin: 'mā ma',
        meaning: 'Mẹ',
        wordType: 'noun',
      },
      {
        id: 'vocab-3-4',
        lessonId: lesson1_3.id,
        hanzi: '哥哥',
        pinyin: 'gē ge',
        meaning: 'Anh trai',
        wordType: 'noun',
      },
      {
        id: 'vocab-3-5',
        lessonId: lesson1_3.id,
        hanzi: '姐姐',
        pinyin: 'jiě jie',
        meaning: 'Chị gái',
        wordType: 'noun',
      },
      {
        id: 'vocab-3-6',
        lessonId: lesson1_3.id,
        hanzi: '弟弟',
        pinyin: 'dì di',
        meaning: 'Em trai',
        wordType: 'noun',
      },
      {
        id: 'vocab-3-7',
        lessonId: lesson1_3.id,
        hanzi: '妹妹',
        pinyin: 'mèi mei',
        meaning: 'Em gái',
        wordType: 'noun',
      },
    ],
    skipDuplicates: true,
  });

  // HSK 2 sample vocabularies
  await prisma.vocabulary.createMany({
    data: [
      {
        id: 'vocab-4-1',
        lessonId: lesson2_1.id,
        hanzi: '时间',
        pinyin: 'shí jiān',
        meaning: 'Thời gian',
        wordType: 'noun',
      },
      {
        id: 'vocab-4-2',
        lessonId: lesson2_1.id,
        hanzi: '点',
        pinyin: 'diǎn',
        meaning: 'Giờ (điểm)',
        wordType: 'measure word',
        example: '八点 (bā diǎn) - 8 giờ',
      },
      {
        id: 'vocab-4-3',
        lessonId: lesson2_1.id,
        hanzi: '分',
        pinyin: 'fēn',
        meaning: 'Phút',
        wordType: 'measure word',
      },
      {
        id: 'vocab-4-4',
        lessonId: lesson2_1.id,
        hanzi: '现在',
        pinyin: 'xiàn zài',
        meaning: 'Bây giờ',
        wordType: 'adverb',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });