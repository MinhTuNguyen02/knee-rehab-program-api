import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssessmentQueryDto {
    /**
     * Cursor timestamp - fetch assessments older than this mark.
     * Used for infinite scroll / load more.
     */
    @ApiPropertyOptional({
        description: 'Cursor: ISO timestamp - fetch assessments BEFORE this time',
        example: '2026-06-15T10:30:00.000Z',
    })
    @IsOptional()
    @IsString()
    before?: string;

    @ApiPropertyOptional({
        description: 'Số lượng items mỗi trang (default: 10, max: 50)',
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;
}
