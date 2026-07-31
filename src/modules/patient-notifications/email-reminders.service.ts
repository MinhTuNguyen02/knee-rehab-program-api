import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Patient } from '../assessments/entities/patient.entity';
import { PatientNotificationsService } from './patient-notifications.service';


@Injectable()
export class EmailRemindersService {
    private readonly logger = new Logger(EmailRemindersService.name);

    constructor(
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        private readonly patientNotificationsService: PatientNotificationsService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) { }

    @Cron('0 8 * * *')
    async handleScheduledReminders() {
        this.logger.log('Start process follow-up email...');
        const scheduleStr = this.configService.get<string>('REMINDER_SCHEDULE') || '0,14,30';
        const schedule = scheduleStr.split(',').map(Number);

        if (schedule.length > 1) {
            await this.processReminderBatch(schedule[1], 'reminder_1');
        }

        if (schedule.length > 2) {
            await this.processReminderBatch(schedule[2], 'reminder_2');
        }
    }

    private async processReminderBatch(daysAgo: number, type: 'reminder_1' | 'reminder_2') {
        if (isNaN(daysAgo) || daysAgo <= 0) return;

        const startOfDay = new Date();
        startOfDay.setDate(startOfDay.getDate() - daysAgo);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        const sentColumn = type === 'reminder_1' ? 'reminder1SentAt' : 'reminder2SentAt';

        const allPatients = await this.patientRepo.find({
            where: {
                createdAt: Between(startOfDay, endOfDay),
                [sentColumn]: IsNull(),
            }
        });

        const patients = allPatients.filter(patient => {
            return patient.notificationPrefs && patient.notificationPrefs.reassessReminder === true;
        });

        if (patients.length === 0) return;

        this.logger.log(`[${type}] Have ${patients.length} patients who registered ${daysAgo} days ago.`);

        const assessPortalUrl = this.configService.get<string>('ASSESS_URL');

        for (const patient of patients) {
            try {
                const subject = type === 'reminder_1'
                    ? `Checking in: It's been ${daysAgo} days. How is your knee feeling?`
                    : `Monthly Check-in: Update your knee rehab progress`;

                const heading = type === 'reminder_1'
                    ? `How is your knee feeling, ${patient.firstName}?`
                    : `Checking in on your journey, ${patient.firstName}`;

                const bodyText = type === 'reminder_1'
                    ? `It's been a couple of weeks since your first assessment. Tracking your progress regularly helps the clinical team understand your recovery trajectory.`
                    : `Consistency is key! It's been a while since your first assessment. Let's see how much your knee function has improved.`;

                const notifTitle = type === 'reminder_1' ? 'Follow-up Assessment Due' : 'Monthly Check-in Due';
                const notifBody = 'Please take 2 minutes to complete your quick follow-up assessment.';

                await this.mailerService.sendMail({
                    to: patient.email,
                    subject: subject,
                    html: `
                        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
                            <h2 style="color: #0f172a;">${heading}</h2>
                            <p style="font-size: 16px; line-height: 1.5;">${bodyText}</p>
                            <p style="font-size: 16px; line-height: 1.5;">Please take 2 minutes to complete a quick follow-up assessment:</p>
                            
                            <a href="${assessPortalUrl}"
                               style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;text-weight:bold;text-decoration:none;border-radius:6px;margin:20px 0;">
                                Start Follow-up Assessment
                            </a>
                            
                            <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
                            <p style="font-size: 12px; color: #64748b;">
                                You are receiving this because you opted into the Knee Rehab Program. 
                                If you wish to stop these reminders, you can update your preferences in the Patient Portal.
                            </p>
                        </div>
                    `,
                });

                this.logger.log(`Sent ${type} email successfully for ${patient.email}`);

                await this.patientNotificationsService.createAndSendNotification(
                    patient.id,
                    'reminder' as any,
                    notifTitle,
                    notifBody,
                    { link: assessPortalUrl }
                );
                this.logger.log(`Sent push notification successfully for ${patient.id}`);

                if (type === 'reminder_1') {
                    patient.reminder1SentAt = new Date();
                } else {
                    patient.reminder2SentAt = new Date();
                }

                await this.patientRepo.save(patient);
            } catch (error) {
                this.logger.error(`Error sending ${type} email to ${patient.email}:`, error);
            }
        }
    }
}