import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientNotificationsService } from './patient-notifications.service';
import { PatientJwtAuthGuard } from '../patient-auth/guards/patient-jwt-auth.guard';

@ApiTags('patient-notifications')
@Controller('patient-notifications')
@UseGuards(PatientJwtAuthGuard)
@ApiBearerAuth()
export class PatientNotificationsController {
    constructor(private readonly notificationsService: PatientNotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get list notifications' })
    getAll(@Req() req: any) {
        return this.notificationsService.getNotifications(req.user.id);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread count' })
    getUnreadCount(@Req() req: any) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark as read' })
    markAsRead(@Req() req: any, @Param('id') id: string) {
        return this.notificationsService.markAsRead(req.user.id, id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all as read' })
    markAllAsRead(@Req() req: any) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }
}