import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** One dialogue turn. Speaker is optional: data may not have it yet. */
export class DialogueLineDto {
  /** Absent → backend alternates A/B by line position (validation S1). */
  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  speaker?: string;

  @IsString()
  @Length(1, 500)
  text: string;
}

/** POST /tts/dialogue body — all turns are merged into ONE audio file. */
export class SynthesizeDialogueDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DialogueLineDto)
  lines: DialogueLineDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000)
  pauseMs?: number;

  /** Playback rate multiplier 0.5-2 (1 = normal), same semantics as text. */
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2)
  speed?: number;
}
