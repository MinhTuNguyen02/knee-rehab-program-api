import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Patient } from '../assessments/entities/patient.entity';
import { PatientLoginDto } from './dto/patient-login.dto';
import { PatientForgotPasswordDto } from './dto/patient-forgot-password.dto';
import { PatientResetPasswordDto } from './dto/patient-reset-password.dto';
import { PatientChangePasswordDto } from './dto/patient-change-password.dto';

@Injectable()
export class PatientAuthService {
    private readonly logger = new Logger(PatientAuthService.name);

    constructor(
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailerService: MailerService,
    ) { }

    //  POST /patient-auth/login
    async login(dto: PatientLoginDto): Promise<{
        data: {
            accessToken: string;
            forcePasswordChange: boolean;
            patient: { id: string; email: string; firstName: string; lastName: string };
        };
    }> {
        // Must use addSelect to get passwordHash because the column has select: false
        const patient = await this.patientRepository
            .createQueryBuilder('patient')
            .addSelect('patient.passwordHash')
            .where('patient.email = :email', { email: dto.email.toLowerCase() })
            .getOne();

        if (!patient) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!patient.passwordHash) {
            throw new UnauthorizedException(
                'Invalid credentials',
            );
        }

        const isPasswordValid = await bcrypt.compare(dto.password, patient.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: patient.id,
            email: patient.email,
            type: 'patient' as const,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        return {
            data: {
                accessToken,
                forcePasswordChange: patient.forcePasswordChange,
                patient: {
                    id: patient.id,
                    email: patient.email,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                },
            },
        };
    }

    //  POST /patient-auth/forgot-password
    async forgotPassword(dto: PatientForgotPasswordDto): Promise<{ data: { message: string } }> {
        const patient = await this.patientRepository.findOneBy({
            email: dto.email.toLowerCase(),
        });

        if (!patient) {
            return { data: { message: 'If an account with this email exists, a reset link has been sent.' } };
        }

        // Create plain token to send via email
        const plainToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

        patient.resetToken = hashedToken;
        patient.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await this.patientRepository.save(patient);

        const patientPortalUrl =
            this.configService.get<string>('PATIENT_PORTAL_URL') ?? 'http://localhost:3003';
        const resetLink = `${patientPortalUrl}/reset-password?token=${plainToken}`;

        this.mailerService.sendMail({
            to: patient.email,
            subject: 'KRPS — Reset your password',
            html: `
                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
                    <h2>Reset your password</h2>
                    <p>Hi ${patient.firstName},</p>
                    <p>We received a request to reset your password for your KRPS account.</p>
                    <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                    <a href="${resetLink}" 
                       style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
                        Reset Password
                    </a>
                    <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                    <p style="color:#999;font-size:12px;">KRPS — Educational assessment tool. Not a substitute for medical advice.</p>
                </div>
            `,
        }).catch((error) => {
            this.logger.error('Failed to send password reset email', error);
        });    // Do not throw - still return success to prevent info leak

        return { data: { message: 'If an account with this email exists, a reset link has been sent.' } };
    }

    //  POST /patient-auth/reset-password
    async resetPassword(dto: PatientResetPasswordDto): Promise<{ data: { message: string } }> {
        // Hash plain token again to compare with value in DB
        const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

        const patient = await this.patientRepository.findOneBy({ resetToken: hashedToken });

        if (!patient || !patient.resetTokenExpiry || patient.resetTokenExpiry < new Date()) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        patient.passwordHash = await bcrypt.hash(dto.newPassword, 10);
        patient.resetToken = null;        // Single-use: invalidate after use
        patient.resetTokenExpiry = null;
        patient.forcePasswordChange = false;

        await this.patientRepository.save(patient);

        return { data: { message: 'Password has been reset successfully.' } };
    }

    //  POST /patient-auth/change-password
    async changePassword(
        patientId: string,
        dto: PatientChangePasswordDto,
    ): Promise<{ data: { message: string } }> {
        const patient = await this.patientRepository
            .createQueryBuilder('patient')
            .addSelect('patient.passwordHash')
            .where('patient.id = :id', { id: patientId })
            .getOne();

        if (!patient) {
            throw new UnauthorizedException('Patient not found');
        }

        if (!patient.forcePasswordChange) {
            // Voluntary change - must have current password
            if (!dto.currentPassword) {
                throw new BadRequestException('Current password is required');
            }
            if (!patient.passwordHash) {
                throw new BadRequestException('No password set for this account');
            }
            const isValid = await bcrypt.compare(dto.currentPassword, patient.passwordHash);
            if (!isValid) {
                throw new BadRequestException('Current password is incorrect');
            }
        }
        // If force_password_change = true -> skip checking current password

        patient.passwordHash = await bcrypt.hash(dto.newPassword, 10);
        patient.forcePasswordChange = false; // Turn off flag after successful change
        await this.patientRepository.save(patient);

        return { data: { message: 'Password changed successfully.' } };
    }

    //  POST /patient/fcm-token
    async saveFcmToken(
        patientId: string,
        fcmToken: string,
    ): Promise<{ data: { message: string } }> {
        await this.patientRepository.update(patientId, { fcmToken });
        return { data: { message: 'FCM token saved.' } };
    }

    // Helper: generate patient account from opt-in
    static generateTempPassword(): string {
        // Temp password: 8 chars, ensures uppercase, number, lowercase
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const all = upper + lower + digits;

        let pass =
            upper[Math.floor(Math.random() * upper.length)] +
            digits[Math.floor(Math.random() * digits.length)] +
            lower[Math.floor(Math.random() * lower.length)];

        for (let i = 3; i < 8; i++) {
            pass += all[Math.floor(Math.random() * all.length)];
        }

        // Shuffle
        return pass
            .split('')
            .sort(() => 0.5 - Math.random())
            .join('');
    }

    async hashPassword(plaintext: string): Promise<string> {
        return bcrypt.hash(plaintext, 10);
    }
}
