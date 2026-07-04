import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'The email of the user' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @ApiProperty({ description: 'The password of the user' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}
