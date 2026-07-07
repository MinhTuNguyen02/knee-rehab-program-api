import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPrefsDto {
    @ApiPropertyOptional({ description: 'Receive assessment reminders via email' })
    @IsOptional()
    @IsBoolean()
    assessmentReminders?: boolean;

    @ApiPropertyOptional({ description: 'Receive email notifications' })
    @IsOptional()
    @IsBoolean()
    emailNotifications?: boolean;

    @ApiPropertyOptional({ description: 'Receive SMS notifications' })
    @IsOptional()
    @IsBoolean()
    smsNotifications?: boolean;
}
