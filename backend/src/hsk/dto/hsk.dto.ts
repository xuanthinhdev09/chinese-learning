import { IsString, IsInt, IsDateString, IsOptional } from 'class-validator';

export class HskResponseDto {
  @IsString()
  id: string;

  @IsInt()
  level: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string | null;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  @IsInt()
  @IsOptional()
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