import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsISO8601, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @IsISO8601()
    before?: string;

    @IsOptional()
    @IsISO8601()
    after?: string;
}

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    body: string;
}