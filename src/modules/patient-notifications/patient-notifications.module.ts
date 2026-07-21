import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientNotificationsController } from './patient-notifications.controller';
import { PatientNotificationsService } from './patient-notifications.service';
import { PatientNotification } from './entities/patient-notification.entity';
import { Patient } from '../assessments/entities/patient.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PatientNotification, Patient]),
    ],
    controllers: [PatientNotificationsController],
    providers: [PatientNotificationsService],
    exports: [PatientNotificationsService],
})
export class PatientNotificationsModule { }