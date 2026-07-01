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

    @IsEnum(['L', 'R'], { message: 'Knee side must be L or R' })
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
