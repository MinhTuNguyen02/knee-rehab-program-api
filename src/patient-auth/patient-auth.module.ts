import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PatientAuthService } from './patient-auth.service';
import { PatientAuthController } from './patient-auth.controller';
import { PatientJwtStrategy } from './strategies/patient-jwt.strategy';
import { PatientJwtAuthGuard } from './guards/patient-jwt-auth.guard';
import { Patient } from '../assessments/entities/patient.entity';
import { ThrottlerModule } from '@nestjs/throttler';
import { EmailThrottlerGuard } from './guards/email-throttler.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Patient]),
        PassportModule.register({ defaultStrategy: 'patient-jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                if (!secret) {
                    throw new Error('JWT_SECRET is not defined in environment variables');
                }
                return {
                    secret,
                    signOptions: { expiresIn: '7d' },
                };
            },
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 10,
        }]),
    ],
    providers: [PatientAuthService, PatientJwtStrategy, PatientJwtAuthGuard, EmailThrottlerGuard],
    controllers: [PatientAuthController],
    exports: [PatientAuthService, PatientJwtStrategy, PatientJwtAuthGuard],
})
export class PatientAuthModule { }
