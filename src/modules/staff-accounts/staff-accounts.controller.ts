import { Controller, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffAccountsService } from './staff-accounts.service';
import { StaffAccountsQueryDto } from './dto/staff-accounts-query.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('staff-accounts')
@Controller('staff/accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class StaffAccountsController {
    constructor(private readonly staffAccountsService: StaffAccountsService) { }

    @Get()
    @ApiOperation({ summary: 'List all staff accounts with filters (Admin only)' })
    @ApiResponse({ status: 200, description: 'Return all matching staff accounts.' })
    findAll(@Query() query: StaffAccountsQueryDto) {
        return this.staffAccountsService.findAll(query);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update active status of a staff account (Admin only)' })
    @ApiResponse({ status: 200, description: 'Staff account status updated successfully.' })
    updateStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateStaffStatusDto,
    ) {
        return this.staffAccountsService.updateStatus(req.user.id, id, dto.isActive);
    }
}
