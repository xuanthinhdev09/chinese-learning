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
  @IsOptional()
  description: string | null;

  @IsInt()
  order: number;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  @IsInt()
  @IsOptional()
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