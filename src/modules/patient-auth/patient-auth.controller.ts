import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientAuthService } from './patient-auth.service';
import { PatientLoginDto } from './dto/patient-login.dto';
import { PatientForgotPasswordDto } from './dto/patient-forgot-password.dto';
import { PatientResetPasswordDto } from './dto/patient-reset-password.dto';
import { PatientChangePasswordDto } from './dto/patient-change-password.dto';
import { PatientJwtAuthGuard } from './guards/patient-jwt-auth.guard';
import { EmailThrottlerGuard } from './guards/email-throttler.guard';
import { IpThrottlerGuard } from 'src/auth/guards/ip-throttler.guard';

@ApiTags('patient-auth')
@Controller('patient-auth')
export class PatientAuthController {
    constructor(private readonly patientAuthService: PatientAuthService) { }

    @UseGuards(IpThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @ApiOperation({ summary: 'Patient login' })
    @ApiResponse({ status: 200, description: 'Login successful. Returns JWT and patient info.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials or account not activated.' })
    login(@Body() dto: PatientLoginDto) {
        return this.patientAuthService.login(dto);
    }

    @UseGuards(EmailThrottlerGuard)
    @Throttle({ default: { limit: 3, ttl: 900000 } })
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset email' })
    @ApiResponse({ status: 200, description: 'Reset email sent (if account exists).' })
    forgotPassword(@Body() dto: PatientForgotPasswordDto) {
        return this.patientAuthService.forgotPassword(dto);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using token from email' })
    @ApiResponse({ status: 200, description: 'Password reset successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
    resetPassword(@Body() dto: PatientResetPasswordDto) {
        return this.patientAuthService.resetPassword(dto);
    }

    @Post('change-password')
    @UseGuards(PatientJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change patient password (supports force change)' })
    @ApiResponse({ status: 200, description: 'Password changed successfully.' })
    @ApiResponse({ status: 400, description: 'Incorrect current password.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    changePassword(@Req() req: any, @Body() dto: PatientChangePasswordDto) {
        return this.patientAuthService.changePassword(req.user.id, dto);
    }
}
