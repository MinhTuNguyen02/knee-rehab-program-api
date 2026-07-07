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
                    // Default expiry — sẽ bị override khi sign với expiresIn: '7d'
                    signOptions: { expiresIn: '7d' },
                };
            },
        }),
    ],
    providers: [PatientAuthService, PatientJwtStrategy, PatientJwtAuthGuard],
    controllers: [PatientAuthController],
    exports: [PatientAuthService, PatientJwtStrategy, PatientJwtAuthGuard],
})
export class PatientAuthModule {}
