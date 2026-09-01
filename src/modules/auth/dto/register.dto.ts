import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ description: 'The email of the user' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @ApiProperty({ description: 'The password of the user' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @ApiProperty({ description: 'The role of the user', required: false, enum: ['admin', 'doctor'] })
    @IsOptional()
    @IsString()
    @IsIn(['admin', 'doctor'], { message: 'Role must be either admin or doctor' })
    role?: string;
}
