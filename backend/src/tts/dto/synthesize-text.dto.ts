import { IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/** POST /tts/synthesize body. Defaults (speed) are applied in the service. */
export class SynthesizeTextDto {
  @IsString()
  @Length(1, 2000)
  text: string;

  /** Optional voice selection; absent → default speaker A's voice. */
  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  speaker?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2)
  speed?: number;
}
