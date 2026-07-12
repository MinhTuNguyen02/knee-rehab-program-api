import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatientLoginDto {
    @ApiProperty({ description: 'Patient\' email' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @ApiProperty({ description: 'Patient\'s password' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;
}
