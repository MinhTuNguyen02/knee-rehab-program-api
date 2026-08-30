import { Injectable, Inject, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PatientNotification, NotificationType } from './entities/patient-notification.entity';
import { PatientDeviceToken } from './entities/patient-device-token.entity';
import { Patient } from '../assessments/entities/patient.entity';
import { getMessaging, Message, MulticastMessage } from 'firebase-admin/messaging';
import type { App } from 'firebase-admin/app';
import { Cron } from '@nestjs/schedule';
import { LessThan } from 'typeorm';

@Injectable()
export class PatientNotificationsService {
    private readonly logger = new Logger(PatientNotificationsService.name);

    constructor(
        @InjectRepository(PatientNotification)
        private readonly notificationRepo: Repository<PatientNotification>,
        @InjectRepository(PatientDeviceToken)
        private readonly tokenRepo: Repository<PatientDeviceToken>,
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        @Inject('FIREBASE_ADMIN')
        private readonly firebaseApp: App,
    ) { }

    @Cron('0 30 2 * * *')
    async handleCronCleanOldPatientNotifications() {
        this.logger.log('Started cleaning up old patient notifications...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            const result = await this.notificationRepo.delete({
                createdAt: LessThan(thirtyDaysAgo),
            });

            if (result.affected && result.affected > 0) {
                this.logger.log(`Successfully deleted ${result.affected} old patient notifications.`);
            }
        } catch (error) {
            this.logger.error('Failed to clean old patient notifications', error);
        }
    }

    async saveFcmToken(patientId: string, fcmToken: string) {
        // Upsert token
        let tokenRecord = await this.tokenRepo.findOne({ where: { token: fcmToken } });
        if (tokenRecord) {
            tokenRecord.patientId = patientId;
            await this.tokenRepo.save(tokenRecord);
        } else {
            tokenRecord = this.tokenRepo.create({ patientId, token: fcmToken });
            await this.tokenRepo.save(tokenRecord);
        }
        return { data: { message: 'FCM token saved.' } };
    }

    async deleteFcmToken(fcmToken: string) {
        await this.tokenRepo.delete({ token: fcmToken });
        return { data: { message: 'FCM token removed.' } };
    }

    // 1. Get lits noti
    async getNotifications(patientId: string, query: { limit?: number; before?: string }) {
        const { limit = 20, before } = query;

        const qb = this.notificationRepo.createQueryBuilder('notif')
            .where('notif.patientId = :patientId', { patientId })
            .orderBy('notif.createdAt', 'DESC')
            .addOrderBy('notif.id', 'DESC') // fallback sort
            .take(limit + 1);

        if (before) {
            qb.andWhere('notif.createdAt < :before', { before: new Date(before) });
        }

        const notifications = await qb.getMany();

        const hasMore = notifications.length > limit;
        if (hasMore) {
            notifications.pop(); // Remove extra record
        }

        return {
            data: notifications,
            meta: {
                hasMore,
                limit,
            },
        };
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

    public async sendPush(patientId: string, notification: PatientNotification) {
        try {
            const tokens = await this.tokenRepo.find({
                where: { patientId },
                select: ['token'],
            });

            if (!tokens || tokens.length === 0) {
                this.logger.log(`No FCM tokens for patient ${patientId}. Skipped push.`);
                return;
            }

            const tokenStrings = tokens.map(t => t.token);

            const message: MulticastMessage = {
                tokens: tokenStrings,
                data: {
                    type: notification.type,
                    id: notification.id,
                    title: notification.title,
                    body: notification.body,
                    isRealtimeUpdate: 'true',
                    conversationId: notification.payload?.conversationId || '',
                }
            };

            const response = await getMessaging(this.firebaseApp).sendEachForMulticast(message);
            this.logger.log(`Broadcasted FCM to Patient ${patientId}: ${response.successCount} successes, ${response.failureCount} failures.`);

            if (response.failureCount > 0) {
                const tokensToRemove: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success && resp.error) {
                        const code = resp.error.code;
                        if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                            tokensToRemove.push(tokenStrings[idx]);
                        }
                    }
                });

                if (tokensToRemove.length > 0) {
                    await this.tokenRepo.createQueryBuilder()
                        .delete()
                        .where('token IN (:...tokensToRemove)', { tokensToRemove })
                        .execute();
                    this.logger.log(`Removed ${tokensToRemove.length} invalid FCM tokens for patient ${patientId}`);
                }
            }
        } catch (error: any) {
            this.logger.error(`Error sending FCM to patient ${patientId}:`, error);
        }
    }
}