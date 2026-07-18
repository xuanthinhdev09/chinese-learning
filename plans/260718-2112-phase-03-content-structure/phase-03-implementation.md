---
title: "Phase 3: Content Structure (HSK + Lessons) - Implementation Plan"
description: "Detailed implementation plan for HSK levels, lessons, and vocabulary modules"
status: pending
priority: P1
effort: 5-6 days
branch: main
tags: [hsk, lessons, vocabulary, content, mvp]
created: 2026-07-18
---

# Phase 3: Content Structure (HSK + Lessons) - Implementation Plan

## Context Links

- High-level plan: `plans/260718-mvp-chinese-learning-platform/phase-03-content-structure-hsk-lessons.md`
- Prisma schema: `backend/prisma/schema.prisma` (verified at lines 46-113)
- Auth module pattern: `backend/src/auth/auth.module.ts` (reference implementation)

## Overview

**Priority:** P1 (Core MVP feature)
**Status:** Pending
**Effort:** 5-6 days (3 days backend, 2-3 days frontend)

Implement content management system for HSK levels (1-6), lessons within each level, and vocabulary items. This phase enables users to browse all learning materials and prepares for progress tracking in Phase 4.

## Key Insights

1. **Prisma schema already complete** - HskLevel, Lesson, Vocabulary models exist (verified in schema.prisma:46-113)
2. **Follow auth module pattern** - Use same structure: module.ts, controller.ts, service.ts, dto/
3. **No authentication required for viewing** - Content endpoints can be public (learning materials)
4. **Frontend already has placeholder pages** - Replace with real implementations
5. **UTF-8 handling critical** - Chinese characters and pinyin tone marks must display correctly

## Requirements

### Functional Requirements

- Display all 6 HSK levels with lesson counts
- View lessons within a specific HSK level
- View lesson details with complete vocabulary list
- Display vocabulary with: hanzi (Chinese character), pinyin (with tone marks), meaning (Vietnamese)
- Pagination for lesson lists (10 lessons per page)
- Basic search/filter for vocabulary (deferred to post-MVP if needed)

### Non-Functional Requirements

- API response time < 300ms for content endpoints
- Efficient database queries with proper indexes
- Lazy loading for vocabulary lists (TanStack Query)
- Proper UTF-8 encoding for Chinese characters
- Chinese font rendering for hanzi display

## Architecture

### Backend Modules Structure

```
backend/src/
├── hsk/
│   ├── hsk.module.ts
│   ├── hsk.controller.ts
│   ├── hsk.service.ts
│   └── dto/
│       └── hsk.dto.ts
├── lessons/
│   ├── lessons.module.ts
│   ├── lessons.controller.ts
│   ├── lessons.service.ts
│   └── dto/
│       ├── lesson.dto.ts
│       └── lesson-query.dto.ts
├── vocabulary/
│   ├── vocabulary.module.ts
│   ├── vocabulary.controller.ts
│   ├── vocabulary.service.ts
│   └── dto/
│       └── vocabulary.dto.ts
└── app.module.ts (updated)
```

### Frontend Structure

```
frontend/src/
├── pages/
│   ├── hsk/
│   │   ├── hsk-list-page.tsx (replace placeholder)
│   │   └── hsk-detail-page.tsx (new)
│   └── lessons/
│       ├── lesson-list-page.tsx (new)
│       └── lesson-detail-page.tsx (replace placeholder)
├── components/
│   ├── hsk/
│   │   └── hsk-card.tsx
│   ├── lessons/
│   │   └── lesson-card.tsx
│   └── vocabulary/
│       ├── vocabulary-card.tsx
│       └── vocabulary-list.tsx
├── api/
│   ├── hsk-api.ts
│   ├── lessons-api.ts
│   └── vocabulary-api.ts
└── App.tsx (update routing)
```

## Related Code Files

### Files to Create (Backend - 13 files)

```
backend/src/hsk/hsk.module.ts
backend/src/hsk/hsk.controller.ts
backend/src/hsk/hsk.service.ts
backend/src/hsk/dto/hsk.dto.ts
backend/src/lessons/lessons.module.ts
backend/src/lessons/lessons.controller.ts
backend/src/lessons/lessons.service.ts
backend/src/lessons/dto/lesson.dto.ts
backend/src/lessons/dto/lesson-query.dto.ts
backend/src/vocabulary/vocabulary.module.ts
backend/src/vocabulary/vocabulary.controller.ts
backend/src/vocabulary/vocabulary.service.ts
backend/src/vocabulary/dto/vocabulary.dto.ts
```

### Files to Create (Frontend - 14 files)

```
frontend/src/api/hsk-api.ts
frontend/src/api/lessons-api.ts
frontend/src/api/vocabulary-api.ts
frontend/src/components/hsk/hsk-card.tsx
frontend/src/components/lessons/lesson-card.tsx
frontend/src/components/vocabulary/vocabulary-card.tsx
frontend/src/components/vocabulary/vocabulary-list.tsx
frontend/src/pages/hsk/hsk-detail-page.tsx
frontend/src/pages/lessons/lesson-list-page.tsx
```

### Files to Modify (6 files)

```
backend/src/app.module.ts (import HskModule, LessonsModule, VocabularyModule)
backend/prisma/seed.ts (create seed data)
frontend/src/pages/hsk/hsk-list-page.tsx (replace placeholder)
frontend/src/pages/lessons/lesson-detail-page.tsx (replace placeholder)
frontend/src/App.tsx (add new routes)
package.json (backend - add seed script)
```

## Implementation Steps

### Phase 3.1: Backend - HSK Module (Day 1 - Morning)

**Reference pattern:** `backend/src/auth/auth.module.ts`

#### Step 3.1.1: Create HSK DTO
**File:** `backend/src/hsk/dto/hsk.dto.ts`

```typescript
import { IsString, IsInt, IsDateString } from 'class-validator';

export class HskResponseDto {
  @IsString()
  id: string;

  @IsInt()
  level: number;

  @IsString()
  name: string;

  @IsString()
  description: string | null;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  lessonCount?: number;
}

export class HskDetailResponseDto extends HskResponseDto {
  lessons: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    vocabularyCount: number;
  }[];
}
```

#### Step 3.1.2: Create HSK Service
**File:** `backend/src/hsk/hsk.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HskService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const levels = await this.prisma.hskLevel.findMany({
      orderBy: { level: 'asc' },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    return levels.map((level) => ({
      ...level,
      lessonCount: level._count.lessons,
    }));
  }

  async findOne(id: string) {
    const level = await this.prisma.hskLevel.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { vocabularies: true },
            },
          },
        },
      },
    });

    if (!level) {
      throw new NotFoundException('HSK level not found');
    }

    return {
      ...level,
      lessons: level.lessons.map((lesson) => ({
        ...lesson,
        vocabularyCount: lesson._count.vocabularies,
      })),
    };
  }
}
```

#### Step 3.1.3: Create HSK Controller
**File:** `backend/src/hsk/hsk.controller.ts`

```typescript
import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { HskService } from './hsk.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('hsk')
export class HskController {
  constructor(private readonly hskService: HskService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.hskService.findAll();
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.hskService.findOne(id);
  }
}
```

#### Step 3.1.4: Create HSK Module
**File:** `backend/src/hsk/hsk.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HskController } from './hsk.controller';
import { HskService } from './hsk.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HskController],
  providers: [HskService],
  exports: [HskService],
})
export class HskModule {}
```

### Phase 3.2: Backend - Lessons Module (Day 1 - Afternoon)

#### Step 3.2.1: Create Lesson DTOs
**File:** `backend/src/lessons/dto/lesson.dto.ts`

```typescript
import { IsString, IsInt, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class LessonResponseDto {
  @IsString()
  id: string;

  @IsString()
  hskLevelId: string;

  @IsString()
  title: string;

  @IsString()
  description: string | null;

  @IsInt()
  order: number;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  vocabularyCount?: number;
}

export class LessonDetailResponseDto extends LessonResponseDto {
  hskLevel: {
    id: string;
    level: number;
    name: string;
  };
  vocabularies: {
    id: string;
    hanzi: string;
    pinyin: string;
    meaning: string;
    audioUrl: string | null;
    example: string | null;
    wordType: string | null;
  }[];
}
```

**File:** `backend/src/lessons/dto/lesson-query.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LessonQueryDto {
  @IsString()
  @IsOptional()
  hskLevelId?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
```

#### Step 3.2.2: Create Lessons Service
**File:** `backend/src/lessons/lessons.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LessonQueryDto } from './dto/lesson-query.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: LessonQueryDto) {
    const { hskLevelId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = hskLevelId ? { hskLevelId } : {};

    const [data, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ hskLevel: { level: 'asc' } }, { order: 'asc' }],
        include: {
          hskLevel: {
            select: { id: true, level: true, name: true },
          },
          _count: {
            select: { vocabularies: true },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      data: data.map((lesson) => ({
        ...lesson,
        vocabularyCount: lesson._count.vocabularies,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        hskLevel: {
          select: { id: true, level: true, name: true },
        },
        vocabularies: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }
}
```

#### Step 3.2.3: Create Lessons Controller
**File:** `backend/src/lessons/lessons.controller.ts`

```typescript
import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonQueryDto } from './dto/lesson-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: LessonQueryDto) {
    return this.lessonsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }
}
```

#### Step 3.2.4: Create Lessons Module
**File:** `backend/src/lessons/lessons.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
```

### Phase 3.3: Backend - Vocabulary Module (Day 2 - Morning)

#### Step 3.3.1: Create Vocabulary DTO
**File:** `backend/src/vocabulary/dto/vocabulary.dto.ts`

```typescript
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class VocabularyResponseDto {
  @IsString()
  id: string;

  @IsString()
  lessonId: string;

  @IsString()
  hanzi: string;

  @IsString()
  pinyin: string;

  @IsString()
  meaning: string;

  @IsString()
  @IsOptional()
  audioUrl: string | null;

  @IsString()
  @IsOptional()
  example: string | null;

  @IsString()
  @IsOptional()
  wordType: string | null;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}
```

#### Step 3.3.2: Create Vocabulary Service
**File:** `backend/src/vocabulary/vocabulary.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VocabularyService {
  constructor(private prisma: PrismaService) {}

  async findByLesson(lessonId: string) {
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { lessonId },
      orderBy: { id: 'asc' },
    });

    return vocabularies;
  }
}
```

#### Step 3.3.3: Create Vocabulary Controller
**File:** `backend/src/vocabulary/vocabulary.controller.ts`

```typescript
import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Public()
  @Get('lesson/:lessonId')
  @HttpCode(HttpStatus.OK)
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.vocabularyService.findByLesson(lessonId);
  }
}
```

#### Step 3.3.4: Create Vocabulary Module
**File:** `backend/src/vocabulary/vocabulary.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
```

### Phase 3.4: Backend - Integration & Seed Data (Day 2 - Afternoon)

#### Step 3.4.1: Update App Module
**File:** `backend/src/app.module.ts`

Add imports after UsersModule:
```typescript
import { HskModule } from './hsk/hsk.module';
import { LessonsModule } from './lessons/lessons.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
```

Add to imports array:
```typescript
@Module({
  imports: [
    // ... existing imports
    UsersModule,
    HskModule,
    LessonsModule,
    VocabularyModule,
  ],
})
```

#### Step 3.4.2: Create Seed Data
**File:** `backend/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
```

#### Step 3.4.3: Update Package JSON
**File:** `backend/package.json`

Add seed script to prisma section:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

#### Step 3.4.4: Run Seed
```bash
cd backend
npx prisma db seed
```

### Phase 3.5: Frontend - API Clients (Day 3 - Morning)

**Reference pattern:** `frontend/src/stores/auth-store.ts`

#### Step 3.5.1: Create HSK API Client
**File:** `frontend/src/api/hsk-api.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface HskLevel {
  id: string;
  level: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lessonCount: number;
}

export interface HskDetail extends HskLevel {
  lessons: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    vocabularyCount: number;
  }[];
}

export const hskApi = {
  async getLevels(): Promise<HskLevel[]> {
    const response = await fetch(`${API_URL}/hsk`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HSK levels');
    }

    return response.json();
  },

  async getLevel(id: string): Promise<HskDetail> {
    const response = await fetch(`${API_URL}/hsk/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HSK level');
    }

    return response.json();
  },
};
```

#### Step 3.5.2: Create Lessons API Client
**File:** `frontend/src/api/lessons-api.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Lesson {
  id: string;
  hskLevelId: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  vocabularyCount: number;
  hskLevel: {
    id: string;
    level: number;
    name: string;
  };
}

export interface LessonDetail extends Lesson {
  vocabularies: {
    id: string;
    hanzi: string;
    pinyin: string;
    meaning: string;
    audioUrl: string | null;
    example: string | null;
    wordType: string | null;
  }[];
}

export interface PaginatedLessons {
  data: Lesson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const lessonsApi = {
  async getLessons(params: {
    hskLevelId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedLessons> {
    const queryParams = new URLSearchParams();
    if (params.hskLevelId) queryParams.set('hskLevelId', params.hskLevelId);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `${API_URL}/lessons?${queryParams.toString()}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch lessons');
    }

    return response.json();
  },

  async getLesson(id: string): Promise<LessonDetail> {
    const response = await fetch(`${API_URL}/lessons/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lesson');
    }

    return response.json();
  },
};
```

#### Step 3.5.3: Create Vocabulary API Client
**File:** `frontend/src/api/vocabulary-api.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Vocabulary {
  id: string;
  lessonId: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  audioUrl: string | null;
  example: string | null;
  wordType: string | null;
  createdAt: string;
  updatedAt: string;
}

export const vocabularyApi = {
  async getByLesson(lessonId: string): Promise<Vocabulary[]> {
    const response = await fetch(
      `${API_URL}/vocabulary/lesson/${lessonId}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary');
    }

    return response.json();
  },
};
```

### Phase 3.6: Frontend - Components (Day 3 - Afternoon)

#### Step 3.6.1: Create HSK Card Component
**File:** `frontend/src/components/hsk/hsk-card.tsx`

```typescript
import { useNavigate } from 'react-router-dom';
import { HskLevel } from '../../api/hsk-api';

interface HskCardProps {
  hsk: HskLevel;
}

export default function HskCard({ hsk }: HskCardProps) {
  const navigate = useNavigate();

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-purple-500',
      4: 'bg-orange-500',
      5: 'bg-red-500',
      6: 'bg-pink-500',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div
      onClick={() => navigate(`/hsk/${hsk.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-16 h-16 ${getLevelColor(hsk.level)} rounded-lg flex items-center justify-center`}>
          <span className="text-white text-2xl font-bold">{hsk.level}</span>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full">
          <span className="text-sm text-gray-600">{hsk.lessonCount} bài học</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2 chinese-text">{hsk.name}</h3>
      {hsk.description && (
        <p className="text-gray-600 text-sm">{hsk.description}</p>
      )}
    </div>
  );
}
```

#### Step 3.6.2: Create Lesson Card Component
**File:** `frontend/src/components/lessons/lesson-card.tsx`

```typescript
import { useNavigate } from 'react-router-dom';
import { Lesson } from '../../api/lessons-api';

interface LessonCardProps {
  lesson: Lesson;
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/lessons/${lesson.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 font-semibold">{lesson.order}</span>
        </div>
        <div className="bg-green-100 px-3 py-1 rounded-full">
          <span className="text-sm text-green-700">{lesson.vocabularyCount} từ</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 chinese-text">{lesson.title}</h3>
      {lesson.description && (
        <p className="text-gray-600 text-sm">{lesson.description}</p>
      )}
    </div>
  );
}
```

#### Step 3.6.3: Create Vocabulary Card Component
**File:** `frontend/src/components/vocabulary/vocabulary-card.tsx`

```typescript
import { Vocabulary } from '../../api/vocabulary-api';

interface VocabularyCardProps {
  vocabulary: Vocabulary;
}

export default function VocabularyCard({ vocabulary }: VocabularyCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="text-center">
        {/* Hanzi - Large, prominent */}
        <div className="text-5xl font-bold text-gray-900 mb-4 chinese-text">{vocabulary.hanzi}</div>

        {/* Pinyin with tone marks */}
        <div className="text-xl text-gray-700 mb-2">{vocabulary.pinyin}</div>

        {/* Meaning - Vietnamese */}
        <div className="text-lg text-gray-900 font-medium mb-3">{vocabulary.meaning}</div>

        {/* Word type badge */}
        {vocabulary.wordType && (
          <div className="inline-block bg-gray-100 px-3 py-1 rounded-full mb-3">
            <span className="text-xs text-gray-600">{vocabulary.wordType}</span>
          </div>
        )}

        {/* Example sentence */}
        {vocabulary.example && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
            <div className="text-sm text-gray-700">{vocabulary.example}</div>
          </div>
        )}

        {/* Audio button placeholder */}
        <div className="mt-4">
          <button
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center justify-center gap-1"
            disabled={!vocabulary.audioUrl}
          >
            <span>🔊</span>
            <span>{vocabulary.audioUrl ? 'Nghe phát âm' : 'Chưa có audio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Step 3.6.4: Create Vocabulary List Component
**File:** `frontend/src/components/vocabulary/vocabulary-list.tsx`

```typescript
import { Vocabulary } from '../../api/vocabulary-api';
import VocabularyCard from './vocabulary-card';

interface VocabularyListProps {
  vocabularies: Vocabulary[];
  loading?: boolean;
}

export default function VocabularyList({ vocabularies, loading }: VocabularyListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (vocabularies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Chưa có từ vựng</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vocabularies.map((vocab) => (
        <VocabularyCard key={vocab.id} vocabulary={vocab} />
      ))}
    </div>
  );
}
```

### Phase 3.7: Frontend - Pages (Day 4)

#### Step 3.7.1: Update HSK List Page
**File:** `frontend/src/pages/hsk/hsk-list-page.tsx`

Replace entire content with:

```typescript
import { useQuery } from '@tanstack/react-query';
import { hskApi, HskLevel } from '../../api/hsk-api';
import HskCard from '../../components/hsk/hsk-card';
import { Link } from 'react-router-dom';

export default function HskListPage() {
  const { data: hskLevels, isLoading, error } = useQuery({
    queryKey: ['hsk-levels'],
    queryFn: () => hskApi.getLevels(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer">
                  <span className="text-white font-bold text-lg chinese-text">中</span>
                </div>
              </Link>
              <span className="ml-2 font-semibold text-gray-900">HSK Levels</span>
            </div>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HSK Levels</h1>
          <p className="mt-2 text-gray-600">Chọn trình độ để bắt đầu học</p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700">Không thể tải dữ liệu HSK</p>
          </div>
        )}

        {hskLevels && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hskLevels.map((hsk) => (
              <HskCard key={hsk.id} hsk={hsk} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

#### Step 3.7.2: Create HSK Detail Page
**File:** `frontend/src/pages/hsk/hsk-detail-page.tsx`

```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hskApi } from '../../api/hsk-api';
import LessonCard from '../../components/lessons/lesson-card';

export default function HskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: hskLevel, isLoading, error } = useQuery({
    queryKey: ['hsk-level', id],
    queryFn: () => hskApi.getLevel(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !hskLevel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700">Không thể tải thông tin HSK level</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                ← Quay lại
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 chinese-text">{hskLevel.name}</h1>
          {hskLevel.description && (
            <p className="mt-2 text-gray-600">{hskLevel.description}</p>
          )}
        </div>

        {/* Lessons */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Bài học ({hskLevel.lessons.length})
          </h2>
        </div>

        {hskLevel.lessons.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <p className="text-blue-700">Chưa có bài học cho trình độ này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hskLevel.lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

#### Step 3.7.3: Update Lesson Detail Page
**File:** `frontend/src/pages/lessons/lesson-detail-page.tsx`

Replace entire content with:

```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lessonsApi, Vocabulary } from '../../api/lessons-api';
import { vocabularyApi } from '../../api/vocabulary-api';
import VocabularyList from '../../components/vocabulary/vocabulary-list';

export default function LessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonsApi.getLesson(lessonId!),
    enabled: !!lessonId,
  });

  const { data: vocabularies, isLoading: vocabLoading } = useQuery({
    queryKey: ['vocabulary', lessonId],
    queryFn: () => vocabularyApi.getByLesson(lessonId!),
    enabled: !!lessonId,
  });

  if (lessonLoading || vocabLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700">Không thể tải thông tin bài học</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                ← Quay lại
              </button>
              <span className="text-sm text-gray-500">{lesson.hskLevel.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">{lesson.order}</span>
            </div>
            <span className="text-sm text-gray-500">Bài học</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 chinese-text">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-2 text-gray-600">{lesson.description}</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            {vocabularies?.length || 0} từ vựng
          </div>
        </div>

        {/* Vocabulary List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Từ vựng</h2>
          <VocabularyList vocabularies={vocabularies || []} loading={vocabLoading} />
        </div>
      </main>
    </div>
  );
}
```

### Phase 3.8: Frontend - Routing Integration (Day 5 - Morning)

#### Step 3.8.1: Update App.tsx
**File:** `frontend/src/App.tsx`

Add import:
```typescript
import HskDetailPage from './pages/hsk/hsk-detail-page';
import LessonListPage from './pages/lessons/lesson-list-page';
```

Add route after HSK list route:
```typescript
<Route
  path="/hsk/:id"
  element={
    <ProtectedRoute>
      <HskDetailPage />
    </ProtectedRoute>
  }
/>
```

### Phase 3.9: Testing & Integration (Day 5 - Afternoon)

#### Step 3.9.1: Verify API Endpoints
Test all endpoints with curl or Postman:
```bash
# GET all HSK levels
curl http://localhost:3000/hsk

# GET specific HSK level
curl http://localhost:3000/hsk/{id}

# GET lessons with pagination
curl "http://localhost:3000/lessons?page=1&limit=10"

# GET lesson by ID
curl http://localhost:3000/lessons/{id}

# GET vocabulary by lesson
curl http://localhost:3000/vocabulary/lesson/{lessonId}
```

#### Step 3.9.2: Verify Frontend Pages
- Navigate to `/hsk` - should show all 6 HSK levels
- Click HSK 1 - should show lessons
- Click a lesson - should show vocabulary cards
- Verify Chinese characters display correctly
- Verify pinyin tone marks display correctly

#### Step 3.9.3: Check UTF-8 Encoding
Add to `backend/src/main.ts` if not present:
```typescript
app.set('utf8', true);
```

## Todo List

### Backend
- [ ] Create HSK module (hsk.module.ts, controller.ts, service.ts, dto/)
- [ ] Create Lessons module (lessons.module.ts, controller.ts, service.ts, dto/)
- [ ] Create Vocabulary module (vocabulary.module.ts, controller.ts, service.ts, dto/)
- [ ] Update app.module.ts with new modules
- [ ] Create seed data script
- [ ] Run seed migration
- [ ] Test all API endpoints

### Frontend
- [ ] Create API clients (hsk-api.ts, lessons-api.ts, vocabulary-api.ts)
- [ ] Create HSK card component
- [ ] Create lesson card component
- [ ] Create vocabulary card component
- [ ] Create vocabulary list component
- [ ] Update HSK list page
- [ ] Create HSK detail page
- [ ] Update lesson detail page
- [ ] Update App.tsx routing
- [ ] Install @tanstack/react-query if not present
- [ ] Test all pages and components

### Integration
- [ ] Verify UTF-8 encoding for Chinese characters
- [ ] Test navigation flow (HSK list → HSK detail → Lesson detail)
- [ ] Verify pagination works for lesson lists
- [ ] Check API response times < 300ms
- [ ] Test with seed data

## Success Criteria

### Backend
- [ ] All HSK levels return with correct lesson counts
- [ ] Lessons return in correct order within HSK level
- [ ] Vocabulary returns complete with hanzi, pinyin, meaning
- [ ] API responses complete in < 300ms
- [ ] Seed data loads successfully
- [ ] All endpoints return proper HTTP status codes

### Frontend
- [ ] HSK levels display in grid with lesson counts
- [ ] HSK detail page shows all lessons for level
- [ ] Lesson detail page shows all vocabulary cards
- [ ] Hanzi displays with proper Chinese font
- [ ] Pinyin tone marks display correctly (ǎ, ē, etc.)
- [ ] Navigation flow works without page reload
- [ ] Loading states display during data fetch

### Integration
- [ ] Seed data creates HSK 1-2 with sample lessons
- [ ] Each lesson has 8-10 vocabulary items
- [ ] Chinese characters render correctly (UTF-8)
- [ ] No console errors during navigation
- [ ] TanStack Query caching works for repeated navigation

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Chinese encoding issues | High | Medium | Test UTF-8 early, add charset headers, verify with seed data |
| Slow queries with many vocabularies | Medium | Low | Add indexes on lessonId, implement pagination |
| Pinyin tone marks display | Medium | Low | Use Unicode tone characters, test in browser |
| TanStack Query not installed | Low | Low | Check package.json, install if needed |
| File growth > 200 lines | Low | Low | Split large components, use composition |

## Security Considerations

- Content endpoints are public (no auth required) - acceptable for learning materials
- Input validation on query parameters (page, limit)
- No sensitive data in content models
- SQL injection prevented by Prisma ORM

## Data Validation

### HSK Level
- level: 1-6 unique integer
- name: non-empty string
- description: optional string

### Lesson
- title: non-empty string
- order: positive integer
- hskLevelId: must reference valid HSK level

### Vocabulary
- hanzi: non-empty Chinese characters
- pinyin: non-empty with tone marks
- meaning: non-empty Vietnamese

## Rollback Plan

### Backend Rollback
```bash
# Remove seed data
npx prisma migrate reset --force

# Remove module imports from app.module.ts
# Delete module directories
rm -rf backend/src/hsk backend/src/lessons backend/src/vocabulary
```

### Frontend Rollback
```bash
# Revert pages to placeholder versions
git checkout frontend/src/pages/hsk/hsk-list-page.tsx
git checkout frontend/src/pages/lessons/lesson-detail-page.tsx

# Remove new components and API clients
rm -rf frontend/src/api frontend/src/components/hsk frontend/src/components/lessons frontend/src/components/vocabulary
```

## Dependencies

### Phase Dependencies
- Phase 1 (Infrastructure): Required - Prisma, NestJS structure
- Phase 2 (Authentication): Required - User auth context for progress tracking (Phase 4)
- Phase 4 (Progress Tracking): Blocked until this phase completes

### Module Dependencies (Backend)
- HSK Module: Independent
- Lessons Module: References HskLevel (FK relation)
- Vocabulary Module: References Lesson (FK relation)

### Module Dependencies (Frontend)
- HSK pages: Independent
- Lesson pages: Dependent on HSK navigation
- Vocabulary components: Dependent on lesson data

## Next Steps

After Phase 3 completes:
1. **Phase 4: Progress Tracking** - Add UserProgress CRUD, mark lessons complete
2. **Phase 5: Spaced Repetition** - Implement review system based on progress
3. **Content Expansion** - Add HSK 3-6 seed data, more lessons per level

## Unresolved Questions

1. **Audio Hosting**: Where will vocabulary audio files be stored? (Deferred to post-MVP)
2. **Search Implementation**: Should vocabulary search be client-side or server-side? (Can implement either way)
3. **Lesson Completion Flow**: Should completion button be on lesson list or detail page? (Decided in Phase 4)
