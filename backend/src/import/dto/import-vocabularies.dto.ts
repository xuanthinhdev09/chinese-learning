import { IsInt, IsOptional, IsString, IsArray, ValidateNested, Matches, MaxLength, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// Regex for Chinese characters (Hanzi)
const HANZI_REGEX = /^[一-鿿]+$/;

// Updated regex to support apostrophes for words like "nǐ de"
// Includes: lowercase letters, tone marks (āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ), spaces, and apostrophes
const PINYIN_REGEX = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s']+$/;

// Lesson slug format: "lesson-order-{n}"
const LESSON_SLUG_REGEX = /^lesson-order-\d+$/;

// Record type validator for lesson_mapping
export class LessonMappingDto implements Record<string, string> {
  [key: string]: string;
}

export class VocabularyItemDto {
  @IsString()
  @Matches(LESSON_SLUG_REGEX, {
    message: 'lesson_slug must match format "lesson-order-{n}" where n is a positive integer'
  })
  lesson_slug: string;

  @IsString()
  @Matches(HANZI_REGEX, { message: 'hanzi must contain Chinese characters only' })
  @MaxLength(50)
  hanzi: string;

  @IsString()
  @Matches(PINYIN_REGEX, {
    message: 'pinyin must contain valid pinyin with tone marks, spaces, and apostrophes only'
  })
  @MaxLength(200)
  pinyin: string;

  @IsString()
  @MaxLength(100)
  english: string;

  @IsString()
  @MaxLength(100)
  vietnamese: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  word_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  example?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  example_pinyin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  example_vietnamese?: string;
}

export class ImportVocabulariesDto {
  @IsInt()
  @Min(1)
  @Max(6)
  hsk_level: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyItemDto)
  vocabularies: VocabularyItemDto[];

  @IsOptional()
  @IsObject()
  lesson_mapping?: Record<string, string>;
}
