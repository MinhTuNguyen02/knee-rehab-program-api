import { Controller, Get, Patch, Body, Param, Query, UseGuards, Req, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientDataService } from './patient-data.service';
import { PatientAuthService } from '../patient-auth/patient-auth.service';
import { PatientJwtAuthGuard } from '../patient-auth/guards/patient-jwt-auth.guard';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AssessmentQueryDto } from './dto/assessment-query.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SaveFcmTokenDto {
    @ApiProperty({ description: 'FCM registration token of the device' })
    @IsString()
    @IsNotEmpty()
    fcmToken: string;
}

@ApiTags('patient-data')
@Controller('patient')
@UseGuards(PatientJwtAuthGuard)
@ApiBearerAuth()
export class PatientDataController {
    constructor(
        private readonly patientDataService: PatientDataService,
        private readonly patientAuthService: PatientAuthService,
    ) {}

    /**
     * GET /patient/me
     * Returns full profile + latest assessment summary
     */
    @Get('me')
    @ApiOperation({ summary: 'Get current patient profile' })
    @ApiResponse({ status: 200, description: 'Patient profile with latest assessment.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getMe(@Req() req: any) {
        return this.patientDataService.getMe(req.user.id);
    }

    /**
     * PATCH /patient/me
     * Update firstName, lastName, mobile
     */
    @Patch('me')
    @ApiOperation({ summary: 'Update patient profile (name, mobile only)' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
    updateMe(@Req() req: any, @Body() dto: UpdatePatientDto) {
        return this.patientDataService.updateMe(req.user.id, dto);
    }

    /**
     * GET /patient/assessments
     * List of patient assessments — cursor-based pagination
     */
    @Get('assessments')
    @ApiOperation({ summary: 'Get patient assessment history (cursor-based)' })
    @ApiQuery({ name: 'before', required: false, description: 'ISO timestamp cursor' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 10, max 50)' })
    @ApiResponse({ status: 200, description: 'Assessment history with pagination meta.' })
    getAssessments(@Req() req: any, @Query() query: AssessmentQueryDto) {
        return this.patientDataService.getAssessments(req.user.id, query);
    }

    /**
     * GET /patient/assessments/:id
     * Detail of a single assessment — can only view own assessments
     */
    @Get('assessments/:id')
    @ApiOperation({ summary: 'Get assessment detail by ID' })
    @ApiResponse({ status: 200, description: 'Assessment detail.' })
    @ApiResponse({ status: 403, description: 'Access denied — not your assessment.' })
    @ApiResponse({ status: 404, description: 'Assessment not found.' })
    getAssessmentDetail(@Req() req: any, @Param('id') id: string) {
        return this.patientDataService.getAssessmentDetail(req.user.id, id);
    }

    /**
     * PATCH /patient/notification-preferences
     * Update notification preferences (merge, do not overwrite)
     */
    @Patch('notification-preferences')
    @ApiOperation({ summary: 'Update notification preferences' })
    @ApiResponse({ status: 200, description: 'Preferences updated.' })
    updateNotificationPreferences(@Req() req: any, @Body() dto: UpdateNotificationPrefsDto) {
        return this.patientDataService.updateNotificationPreferences(req.user.id, dto);
    }

    /**
     * POST /patient/fcm-token
     * Save FCM token of the device to receive push notifications
     */
    @Post('fcm-token')
    @ApiOperation({ summary: 'Save FCM token for push notifications' })
    @ApiResponse({ status: 200, description: 'FCM token saved.' })
    saveFcmToken(@Req() req: any, @Body() dto: SaveFcmTokenDto) {
        return this.patientAuthService.saveFcmToken(req.user.id, dto.fcmToken);
    }
}
