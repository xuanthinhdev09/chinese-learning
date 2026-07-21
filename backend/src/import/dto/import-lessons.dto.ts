import { IsInt, IsOptional, IsString, IsArray, ValidateNested, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class LessonItemDto {
  @IsInt()
  @Min(1)
  order: number;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class ImportLessonsDto {
  @IsInt()
  @Min(1)
  @Max(6)
  hsk_level: number;

  @IsOptional()
  @IsString()
  hsk_version?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonItemDto)
  lessons: LessonItemDto[];
}
