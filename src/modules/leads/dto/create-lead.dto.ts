import { IsString, IsEmail, IsNotEmpty, IsNumber, Min, Max, IsBoolean, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
    @ApiPropertyOptional({ description: 'First name of the lead' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ description: 'Last name of the lead' })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ description: 'Email address of the lead' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @ApiPropertyOptional({ description: 'Mobile number of the lead' })
    @IsOptional()
    @IsString()
    mobile?: string;

    @ApiPropertyOptional({ description: 'Age of the lead', minimum: 1, maximum: 120 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(120)
    age?: number;

    @ApiPropertyOptional({ description: 'Gender of the lead' })
    @IsOptional()
    @IsString()
    gender?: string;

    @ApiPropertyOptional({ description: 'Knee side affected', enum: ['L', 'R', 'B'] })
    @IsOptional()
    @IsEnum(['L', 'R', 'B'], { message: 'Knee side must be L, R, B' })
    kneeSide?: string;

    @ApiPropertyOptional({ description: 'Whether consent is accepted' })
    @IsOptional()
    @IsBoolean()
    consentAccepted?: boolean;

    @ApiPropertyOptional({ description: 'Notification preferences' })
    @IsOptional()
    @IsObject()
    notificationPrefs?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Associated assessment ID' })
    @IsOptional()
    @IsUUID('4', { message: 'assessmentId must be a valid UUID' })
    assessmentId?: string;
}
