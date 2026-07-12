import { IsString, IsOptional, Matches, MinLength } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class PatientChangePasswordDto {
    /**
     * Current password — optional when force_password_change = true (changing from temp password).
     * Required when patient voluntarily changes password.
     */
    @ApiPropertyOptional({ description: 'Current password (ignored if forced change is active)' })
    @IsOptional()
    @IsString()
    currentPassword?: string;

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
