import { IsString, IsEmail, IsNotEmpty, IsNumber, Min, Max, IsBoolean, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateLeadDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @IsString()
    @IsNotEmpty()
    mobile: string;

    @IsNumber()
    @Min(1)
    @Max(120)
    age: number;

    @IsString()
    @IsNotEmpty()
    gender: string;

    @IsEnum(['L', 'R', 'B', 'both'], { message: 'Knee side must be L, R, B or both' })
    kneeSide: string;

    @IsBoolean()
    consentAccepted: boolean;

    @IsOptional()
    @IsObject()
    notificationPrefs?: Record<string, any>;

    @IsOptional()
    @IsUUID('4', { message: 'assessmentId must be a valid UUID' })
    assessmentId?: string;
}
