import { IsBoolean, IsInt, IsString, IsArray, IsObject } from 'class-validator';

export class IdMappingResponseDto {
  @IsBoolean()
  success: boolean;

  @IsInt()
  hsk_level: number;

  @IsInt()
  created_count: number;

  @IsInt()
  skipped_count: number;

  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @IsObject()
  mapping: Record<string, string>; // slug -> CUID

  @IsString()
  exported_at: string;
}
