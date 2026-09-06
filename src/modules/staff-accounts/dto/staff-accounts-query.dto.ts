import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StaffAccountsQueryDto {
    @ApiPropertyOptional({ description: 'Filter by email substring' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by role: admin | doctor | all', example: 'doctor' })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ description: 'Filter by status: active | inactive | all', example: 'active' })
    @IsOptional()
    @IsString()
    status?: string;
}
