import { IsString, MinLength } from 'class-validator';

/**
 * PATCH /users/me/password body.
 * Min length 8 matches the register rule (auth/dto/register.dto.ts).
 */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
