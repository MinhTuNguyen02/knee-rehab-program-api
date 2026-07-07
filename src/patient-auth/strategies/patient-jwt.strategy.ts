import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Patient } from '../../assessments/entities/patient.entity';

export interface PatientJwtPayload {
    sub: string;
    email: string;
    type: 'patient';
}

/**
 * Dedicated JWT Strategy for patient - name 'patient-jwt'.
 * Only accepts tokens with payload.type === 'patient'.
 * Token is extracted from Authorization: Bearer header.
 */
@Injectable()
export class PatientJwtStrategy extends PassportStrategy(Strategy, 'patient-jwt') {
    constructor(
        @InjectRepository(Patient)
        private patientRepository: Repository<Patient>,
        private configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey:
                configService.get<string>('JWT_SECRET') ??
                (() => {
                    throw new Error('JWT_SECRET is not defined in environment variables');
                })(),
        });
    }

    async validate(payload: PatientJwtPayload) {
        // Ensure the token was signed by patient auth, not admin auth
        if (payload.type !== 'patient') {
            throw new UnauthorizedException('Invalid token type');
        }

        const patient = await this.patientRepository.findOne({
            where: { id: payload.sub },
            select: ['id', 'email', 'firstName', 'lastName', 'forcePasswordChange'],
        });

        if (!patient) {
            throw new UnauthorizedException('Patient not found');
        }

        return {
            id: patient.id,
            email: patient.email,
            firstName: patient.firstName,
            lastName: patient.lastName,
            forcePasswordChange: patient.forcePasswordChange,
        };
    }
}
