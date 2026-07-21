import { IsInt, IsOptional, IsString, IsArray, ValidateNested, IsUrl, Matches, MaxLength, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// Regex patterns
const LESSON_SLUG_REGEX = /^lesson-order-\d+$/;
// Include Chinese characters, spaces, and common Chinese punctuation (、，？！。：；""''（）—) plus ASCII dots for ellipsis
const HANZI_REGEX = /^[一-鿿\s、，？！。：；""''（）—.]+$/;
// Include pinyin with tone marks (uppercase and lowercase), spaces, and common punctuation
const PINYIN_REGEX = /^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s',.!?;:"'()]+$/;
// Vocabulary slug format: "vocab-hanzi-{hanzi}" or with lesson context
const VOCAB_SLUG_REGEX = /^vocab-hanzi-[一-鿿]+(?:-lesson-\d+)?$/;

export class VocabularyRefDto {
  @IsString()
  @Matches(VOCAB_SLUG_REGEX, {
    message: 'vocab_slug must match format "vocab-hanzi-{hanzi}" or "vocab-hanzi-{hanzi}-lesson-{order}"'
  })
  vocab_slug: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;
}

export class ConversationItemDto {
  @IsString()
  @Matches(LESSON_SLUG_REGEX, {
    message: 'lesson_slug must match format "lesson-order-{n}"'
  })
  lesson_slug: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsString()
  @Matches(HANZI_REGEX, { message: 'hanzi must contain Chinese characters and spaces only' })
  @MaxLength(500)
  hanzi: string;

  @IsString()
  @Matches(PINYIN_REGEX, { message: 'pinyin must contain valid pinyin with tone marks' })
  @MaxLength(500)
  pinyin: string;

  @IsString()
  @MaxLength(500)
  vietnamese: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  audio_url?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyRefDto)
  vocabularies: VocabularyRefDto[];
}

export class ImportConversationsDto {
  @IsInt()
  @Min(1)
  @Max(6)
  hsk_level: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationItemDto)
  conversations: ConversationItemDto[];

  @IsOptional()
  @IsObject()
  lesson_mapping?: Record<string, string>;

  @IsOptional()
  @IsObject()
  vocab_mapping?: Record<string, string>;
}
