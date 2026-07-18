import { IsString, IsOptional, IsDateString, IsInt } from 'class-validator';

export class VocabularyResponseDto {
  @IsString()
  id: string;

  @IsString()
  lessonId: string;

  @IsString()
  hanzi: string;

  @IsString()
  @IsOptional()
  traditional: string | null;

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

  @IsString()
  @IsOptional()
  pos: string | null;

  @IsString()
  @IsOptional()
  hskCode: string | null;

  @IsInt()
  @IsOptional()
  hskLevel: number | null;

  @IsString()
  @IsOptional()
  variants: string | null;

  @IsString()
  @IsOptional()
  cedict: string | null;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}

export class ImportVocabularyDto {
  @IsString()
  lessonId: string;

  @IsString()
  hanzi: string;

  @IsString()
  @IsOptional()
  traditional?: string;

  @IsString()
  pinyin: string;

  @IsString()
  meaning: string;

  @IsString()
  @IsOptional()
  pos?: string;

  @IsString()
  @IsOptional()
  hskCode?: string;

  @IsInt()
  @IsOptional()
  hskLevel?: number;

  @IsString()
  @IsOptional()
  variants?: string;

  @IsString()
  @IsOptional()
  cedict?: string;
}