import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { StaffNotification } from './entities/staff-notification.entity';
import { User } from '../auth/entities/user.entity';
import { getMessaging, Message } from 'firebase-admin/messaging';
import type { App } from 'firebase-admin/app';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan } from 'typeorm';

@Injectable()
export class StaffNotificationsService {
    private readonly logger = new Logger(StaffNotificationsService.name);

    constructor(
        @InjectRepository(StaffNotification)
        private readonly notificationRepo: Repository<StaffNotification>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @Inject('FIREBASE_ADMIN')
        private readonly firebaseApp: App,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleCronCleanOldNotifications() {
        this.logger.log('Started cleaning up old staff notifications...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            const result = await this.notificationRepo.delete({
                createdAt: LessThan(thirtyDaysAgo),
            });

            if (result.affected && result.affected > 0) {
                this.logger.log(`Successfully deleted ${result.affected} old staff notifications.`);
            }
        } catch (error) {
            this.logger.error('Failed to clean old staff notifications', error);
        }
    }

    async saveFcmToken(userId: string, fcmToken: string) {
        await this.userRepo.update(userId, { fcmToken });
        return { data: { message: 'FCM token saved.' } };
    }

    // API: Get notifications
    async getNotifications(userId: string, query: { limit?: number; before?: string }) {
        const { limit = 20, before } = query;

        const qb = this.notificationRepo.createQueryBuilder('notif')
            .where('notif.userId = :userId', { userId })
            .orderBy('notif.createdAt', 'DESC')
            .addOrderBy('notif.id', 'DESC')
            .take(limit + 1);

        if (before) {
            qb.andWhere('notif.createdAt < :before', { before: new Date(before) });
        }

        const notifications = await qb.getMany();

        const hasMore = notifications.length > limit;
        if (hasMore) {
            notifications.pop();
        }

        return {
            data: notifications,
            meta: {
                hasMore,
                limit,
            },
        };
    }

    // API: Get unread count
    async getUnreadCount(userId: string) {
        const count = await this.notificationRepo.count({
            where: { userId, readAt: IsNull() },
        });
        return { data: { count } };
    }

    // API: Mark as read
    async markAsRead(userId: string, notificationId: string) {
        const notification = await this.notificationRepo.findOne({ where: { id: notificationId } });
        if (!notification || notification.userId !== userId) throw new NotFoundException('Not found');

        notification.readAt = new Date();
        await this.notificationRepo.save(notification);
        return { data: { success: true } };
    }

    // API: Mark all as read
    async markAllAsRead(userId: string) {
        await this.notificationRepo.update({ userId, readAt: IsNull() }, { readAt: new Date() });
        return { data: { success: true } };
    }

    public async broadcastPush(notifications: StaffNotification[]) {
        if (!notifications || notifications.length === 0) return;

        const userIds = notifications.map(n => n.userId);
        const users = await this.userRepo.createQueryBuilder('user')
            .where('user.id IN (:...userIds)', { userIds })
            .andWhere('user.fcmToken IS NOT NULL')
            .select(['user.id', 'user.fcmToken'])
            .getMany();

        const messages: Message[] = [];
        const validTokens: string[] = [];

        users.forEach(user => {
            const notif = notifications.find(n => n.userId === user.id);
            if (notif && user.fcmToken) {
                validTokens.push(user.fcmToken);
                messages.push({
                    token: user.fcmToken,
                    data: {
                        type: notif.type,
                        id: notif.id,
                        title: notif.title,
                        body: notif.body,
                        isRealtimeUpdate: 'true',
                        conversationId: notif.payload?.conversationId || '',
                    },
                });
            }
        });

        if (messages.length === 0) return;

        try {
            const response = await getMessaging(this.firebaseApp).sendEach(messages);
            this.logger.log(`Broadcasted FCM to Staff: ${response.successCount} successes, ${response.failureCount} failures.`);

            if (response.failureCount > 0) {
                const tokensToRemove: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success && resp.error) {
                        const code = resp.error.code;
                        if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                            tokensToRemove.push(validTokens[idx]);
                        }
                    }
                });

                if (tokensToRemove.length > 0) {
                    await this.userRepo.createQueryBuilder()
                        .update(User)
                        .set({ fcmToken: null })
                        .where('fcm_token IN (:...tokensToRemove)', { tokensToRemove })
                        .execute();
                }
            }
        } catch (error) {
            this.logger.error(`Error in broadcastPush:`, error);
        }
    }
}