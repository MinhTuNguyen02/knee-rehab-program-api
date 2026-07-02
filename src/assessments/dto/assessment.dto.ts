import { IsNumber, Min, Max } from 'class-validator';

export class AssessmentDto {
    @IsNumber()
    @Min(0)
    @Max(10)
    pain: number;

    @IsNumber()
    @Min(0)
    @Max(10)
    function: number;
}