import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * PATCH /users/me body. Field-level shape validated here; avatar membership
 * in the preset emoji list is enforced in UsersService (AVATAR_EMOJIS).
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
