import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'The email of the user' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;
}
