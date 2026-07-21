import { Injectable, Inject, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PatientNotification, NotificationType } from './entities/patient-notification.entity';
import { Patient } from '../assessments/entities/patient.entity';
import { getMessaging, Message } from 'firebase-admin/messaging';
import type { App } from 'firebase-admin/app';

@Injectable()
export class PatientNotificationsService {
    private readonly logger = new Logger(PatientNotificationsService.name);

    constructor(
        @InjectRepository(PatientNotification)
        private readonly notificationRepo: Repository<PatientNotification>,
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        @Inject('FIREBASE_ADMIN')
        private readonly firebaseApp: App,
    ) { }

    // 1. Get lits noti
    async getNotifications(patientId: string, limit = 20) {
        const rawData = await this.notificationRepo.find({
            where: { patientId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        return { data: rawData };
    }

    // 2. Get unread count
    async getUnreadCount(patientId: string) {
        const count = await this.notificationRepo.count({
            where: { patientId, readAt: IsNull() },
        });
        return { data: { count } };
    }

    // 3. Mark as read
    async markAsRead(patientId: string, notificationId: string) {
        const notification = await this.notificationRepo.findOne({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.patientId !== patientId) {
            throw new ForbiddenException('You do not have permission to access this notification');
        }

        notification.readAt = new Date();
        await this.notificationRepo.save(notification);

        return { data: { success: true } };
    }

    // 4. Mark all as read
    async markAllAsRead(patientId: string) {
        await this.notificationRepo.update(
            { patientId, readAt: IsNull() },
            { readAt: new Date() },
        );
        return { data: { success: true } };
    }

    // 5. Send noti
    async createAndSendNotification(
        patientId: string,
        type: NotificationType,
        title: string,
        body: string,
        payload: any = {},
    ) {
        // Save into database
        const notification = this.notificationRepo.create({
            patientId,
            type,
            title,
            body,
            payload,
        });
        await this.notificationRepo.save(notification);

        // Send Push Notification via FCM
        await this.sendPush(patientId, notification);

        return notification;
    }

    private async sendPush(patientId: string, notification: PatientNotification) {
        try {
            const patient = await this.patientRepo.findOne({
                where: { id: patientId },
                select: ['fcmToken'],
            });

            if (!patient || !patient.fcmToken) {
                this.logger.log(`No FCM token for patient ${patientId}. Skipped push.`);
                return;
            }

            // Payload sending
            const message: Message = {
                token: patient.fcmToken,

                data: {
                    type: notification.type,
                    id: notification.id,
                    title: notification.title,
                    body: notification.body,
                    isRealtimeUpdate: 'true',
                },

                notification: {
                    title: notification.title,
                    body: notification.body,
                },
            };

            const response = await getMessaging(this.firebaseApp).send(message);
            this.logger.log(`Successfully sent FCM message: ${response}`);

        } catch (error: any) {
            this.logger.error(`Error sending FCM to patient ${patientId}:`, error);

            // If token is no longer valid, remove token in DB
            if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
            ) {
                await this.patientRepo.update(patientId, { fcmToken: null });
                this.logger.log(`Removed invalid FCM token for patient ${patientId}`);
            }
        }
    }
}