import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaffNotificationsService } from './staff-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('staff-notifications')
@Controller('staff')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StaffNotificationsController {
    constructor(private readonly notificationsService: StaffNotificationsService) { }

    @Post('fcm-token')
    @ApiOperation({ summary: 'Save FCM token for staff push notifications' })
    saveFcmToken(@Req() req: any, @Body('fcmToken') fcmToken: string) {
        return this.notificationsService.saveFcmToken(req.user.id, fcmToken);
    }

    @Get('notifications')
    getAll(@Req() req: any, @Query('limit') limit?: number, @Query('before') before?: string) {
        const parsedLimit = limit ? parseInt(limit.toString(), 10) : 20;
        return this.notificationsService.getNotifications(req.user.id, { limit: parsedLimit, before });
    }

    @Get('notifications/unread-count')
    getUnreadCount(@Req() req: any) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }

    @Patch('notifications/:id/read')
    markAsRead(@Req() req: any, @Param('id') id: string) {
        return this.notificationsService.markAsRead(req.user.id, id);
    }

    @Patch('notifications/read-all')
    markAllAsRead(@Req() req: any) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }
}