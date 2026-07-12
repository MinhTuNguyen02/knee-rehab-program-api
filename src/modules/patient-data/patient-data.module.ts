import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientDataService } from './patient-data.service';
import { PatientDataController } from './patient-data.controller';
import { PatientAuthModule } from '../patient-auth/patient-auth.module';
import { Patient } from '../assessments/entities/patient.entity';
import { Assessment } from '../assessments/entities/assessment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Patient, Assessment]),
        PatientAuthModule, // required for PatientJwtAuthGuard, PatientAuthService (FCM token)
    ],
    providers: [PatientDataService],
    controllers: [PatientDataController],
})
export class PatientDataModule {}
