import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsISO8601 } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import escapeHtml from 'escape-html';

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
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return escapeHtml(value.trim());
        }
        return value;
    })
    @IsString()
    @IsNotEmpty({ message: 'Message body cannot be empty or just spaces' })
    body: string;
}