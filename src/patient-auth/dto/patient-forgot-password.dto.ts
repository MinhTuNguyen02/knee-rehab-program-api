import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatientForgotPasswordDto {
    @ApiProperty({ description: 'Patient\'s email address' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;
}
