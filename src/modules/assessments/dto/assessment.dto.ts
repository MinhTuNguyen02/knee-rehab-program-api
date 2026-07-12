import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssessmentDto {
    @ApiProperty({ description: 'The pain score (0-10)', minimum: 0, maximum: 10 })
    @IsNumber()
    @Min(0)
    @Max(10)
    pain: number;

    @ApiProperty({ description: 'The function score (0-10)', minimum: 0, maximum: 10 })
    @IsNumber()
    @Min(0)
    @Max(10)
    function: number;
}