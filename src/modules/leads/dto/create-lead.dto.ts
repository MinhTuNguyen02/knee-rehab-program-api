import { IsString, IsEmail, IsNotEmpty, IsNumber, Min, Max, IsBoolean, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
    @ApiProperty({ description: 'First name of the lead' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ description: 'Last name of the lead' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ description: 'Email address of the lead' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @ApiProperty({ description: 'Mobile number of the lead' })
    @IsString()
    @IsNotEmpty()
    mobile: string;

    @ApiProperty({ description: 'Age of the lead', minimum: 1, maximum: 120 })
    @IsNumber()
    @Min(1)
    @Max(120)
    age: number;

    @ApiProperty({ description: 'Gender of the lead' })
    @IsString()
    @IsNotEmpty()
    gender: string;

    @ApiProperty({ description: 'Knee side affected', enum: ['L', 'R', 'B'] })
    @IsEnum(['L', 'R', 'B'], { message: 'Knee side must be L, R, B' })
    kneeSide: string;

    @ApiProperty({ description: 'Whether consent is accepted' })
    @IsBoolean()
    consentAccepted: boolean;

    @ApiPropertyOptional({ description: 'Notification preferences' })
    @IsOptional()
    @IsObject()
    notificationPrefs?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Associated assessment ID' })
    @IsOptional()
    @IsUUID('4', { message: 'assessmentId must be a valid UUID' })
    assessmentId?: string;
}
