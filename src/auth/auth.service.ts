import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
    private allowedDomain: string;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailerService: MailerService,
    ) {
        this.allowedDomain = this.configService.get<string>('ALLOWED_ADMIN_DOMAIN') || 'krps.com';
    }

    private validateEmailDomain(email: string) {
        const parts = email.split('@');
        if (parts.length !== 2 || parts[1].toLowerCase() !== this.allowedDomain.toLowerCase()) {
            throw new BadRequestException(`Email domain must be @${this.allowedDomain}`);
        }
    }

    async register(dto: RegisterDto): Promise<{ id: string; email: string; role: string }> {
        this.validateEmailDomain(dto.email);

        const existingUser = await this.userRepository.findOneBy({ email: dto.email.toLowerCase() });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const newUser = this.userRepository.create({
            email: dto.email.toLowerCase(),
            passwordHash,
            role: 'admin',
        });

        const savedUser = await this.userRepository.save(newUser);

        return {
            id: savedUser.id,
            email: savedUser.email,
            role: savedUser.role,
        };
    }

    async login(dto: LoginDto): Promise<{ access_token: string; email: string; role: string }> {
        const user = await this.userRepository.findOneBy({ email: dto.email.toLowerCase() });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        return {
            access_token: accessToken,
            email: user.email,
            role: user.role,
        };
    }

    async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequestException('Incorrect current password');
        }

        user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.userRepository.save(user);

        return { message: 'Password changed successfully' };
    }

    async forgotPassword(dto: ForgotPasswordDto): Promise<{ resetToken: string; message: string }> {
        const user = await this.userRepository.findOneBy({ email: dto.email.toLowerCase() });
        if (!user) {
            return {
                resetToken: '', // Return empty for non-existent users
                message: 'If a user with this email exists, a reset token has been generated',
            };
        }

        const token = crypto.randomUUID();
        user.resetToken = token;
        user.resetTokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

        await this.userRepository.save(user);

        // Construct reset link
        const resetLink = `http://localhost:3002/reset-password?token=${token}`;

        // Attempt to send email
        const smtpHost = this.configService.get<string>('SMTP_HOST');
        if (smtpHost) {
            try {
                await this.mailerService.sendMail({
                    to: user.email,
                    subject: 'Password Reset Request',
                    text: `You requested a password reset. Click here to reset your password: ${resetLink}`,
                    html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>`,
                });
            } catch (error) {
                console.error('Failed to send email, logging link instead:', resetLink);
                // Also log the actual error for debugging
                console.error(error);
            }
        } else {
            console.log('No SMTP configured. Logging link instead:', resetLink);
        }

        // We return success even if email failed or user didn't exist
        return {
            resetToken: token, // Returning token for easy testing if SMTP fails
            message: 'If a user with this email exists, a reset token has been generated',
        };
    }

    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        const user = await this.userRepository.findOneBy({ resetToken: dto.token });
        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            throw new BadRequestException('Invalid or expired token');
        }

        user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await this.userRepository.save(user);

        return { message: 'Password reset successfully' };
    }
}
