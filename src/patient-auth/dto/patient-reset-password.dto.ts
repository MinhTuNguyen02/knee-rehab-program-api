import { IsString, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatientResetPasswordDto {
    @ApiProperty({ description: 'Reset token received from email' })
    @IsString()
    @IsNotEmpty({ message: 'Token is required' })
    token: string;

    @ApiProperty({
        description: 'New password (minimum 8 characters, at least 1 uppercase letter and 1 number)',
        example: 'MyNewPass1',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
    @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number' })
    newPassword: string;
}
