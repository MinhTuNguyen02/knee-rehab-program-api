import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStaffStatusDto {
    @ApiProperty({ description: 'Active status of the staff account', example: true })
    @IsBoolean()
    isActive: boolean;
}
