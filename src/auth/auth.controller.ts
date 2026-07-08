import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { EmailThrottlerGuard } from './guards/email-throttler.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @ApiOperation({ summary: 'Login a user' })
    @ApiResponse({ status: 200, description: 'User successfully logged in.' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change user password' })
    @ApiResponse({ status: 200, description: 'Password successfully changed.' })
    changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto);
    }

    @UseGuards(EmailThrottlerGuard)
    @Throttle({ default: { limit: 3, ttl: 900000 } })
    @Post('forgot-password')
    @ApiOperation({ summary: 'Forgot password' })
    @ApiResponse({ status: 200, description: 'Password reset link sent.' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password' })
    @ApiResponse({ status: 200, description: 'Password successfully reset.' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }
}
