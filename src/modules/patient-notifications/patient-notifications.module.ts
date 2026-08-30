import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientNotificationsController } from './patient-notifications.controller';
import { PatientNotificationsService } from './patient-notifications.service';
import { PatientNotification } from './entities/patient-notification.entity';
import { PatientDeviceToken } from './entities/patient-device-token.entity';
import { Patient } from '../assessments/entities/patient.entity';
import { EmailRemindersService } from './email-reminders.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PatientNotification, PatientDeviceToken, Patient]),
    ],
    controllers: [PatientNotificationsController],
    providers: [PatientNotificationsService, EmailRemindersService],
    exports: [PatientNotificationsService],
})
export class PatientNotificationsModule { }