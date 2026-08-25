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
    @Type(() => Number)
    before?: number;

    @IsOptional()
    @Type(() => Number)
    after?: number;
}

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty({ message: 'Message ID is required' })
    id: string;

    @IsInt()
    @IsNotEmpty({ message: 'Client timestamp is required' })
    client_timestamp: number;

    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return escapeHtml(value.trim());
        }
        return value;
    })
    @IsString()
    @IsNotEmpty({ message: 'Message body cannot be empty or just spaces' })
    body: string;

    @IsOptional()
    @IsString()
    replyToMessageId?: string;
}