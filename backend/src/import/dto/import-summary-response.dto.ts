import { IsBoolean, IsInt, IsString, IsArray, IsOptional } from 'class-validator';

export class ImportSummaryResponseDto {
  @IsBoolean()
  success: boolean;

  @IsInt()
  hsk_level: number;

  @IsString()
  import_type: 'lessons' | 'vocabularies' | 'conversations';

  @IsInt()
  total_records: number;

  @IsInt()
  created_count: number;

  @IsInt()
  skipped_count: number;

  @IsInt()
  failed_count: number;

  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @IsOptional()
  @IsString()
  mapping_file?: string;

  @IsString()
  imported_at: string;
}
