import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource, In } from 'typeorm';
import { Conversation } from './entities/conversations.entity';
import { Message, SenderType } from './entities/messages.entity';
import { MessageReaction, ReactionSenderType } from './entities/message-reaction.entity';
import { CreateMessageDto, GetMessagesQueryDto } from './dto/chat.dto';
import { PatientNotificationsService } from '../patient-notifications/patient-notifications.service';
import { NotificationType, PatientNotification } from '../patient-notifications/entities/patient-notification.entity';
import { StaffNotificationsService } from '../staff-notifications/staff-notifications.service';
import { StaffNotification } from '../staff-notifications/entities/staff-notification.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);
    constructor(
        @InjectRepository(Conversation)
        private conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepo: Repository<Message>,
        @InjectRepository(MessageReaction)
        private reactionRepo: Repository<MessageReaction>,
        private readonly notificationsService: PatientNotificationsService,
        private readonly staffNotificationService: StaffNotificationsService,
        private dataSource: DataSource,
    ) { }

    // Retrieve or initialize conversation for a specific patient
    async getOrCreateConversation(patientId: string): Promise<Conversation> {
        const existing = await this.conversationRepo.findOne({
            where: { patientId },
            relations: ['patient'],
        });

        if (existing) {
            return existing;
        }

        const newConv = this.conversationRepo.create({ patientId });
        const saved = await this.conversationRepo.save(newConv);
        // Re-fetch to include patient details relation
        const conversation = await this.conversationRepo.findOne({
            where: { id: saved.id },
            relations: ['patient'],
        });

        if (!conversation) {
            throw new NotFoundException('Failed to retrieve conversation after creation.');
        }

        return conversation;
    }

    // Patient side: Get messages for current patient
    async getMessages(patientId: string, query: GetMessagesQueryDto) {
        const conversation = await this.getOrCreateConversation(patientId);
        const { limit = 20, before, after } = query;

        const qb = this.messageRepo.createQueryBuilder('message')
            .leftJoinAndSelect('message.replyToMessage', 'replyToMessage')
            .where('message.conversation_id = :conversationId', { conversationId: conversation.id })
            .addSelect('COALESCE(message.client_timestamp, EXTRACT(EPOCH FROM message.sent_at) * 1000)', 'sort_time')
            .orderBy('sort_time', 'DESC')
            .addOrderBy('message.id', 'DESC')
            .take(limit + 1);

        if (before) {
            qb.andWhere('COALESCE(message.client_timestamp, EXTRACT(EPOCH FROM message.sent_at) * 1000) < :before', { before });
        }

        if (after) {
            qb.andWhere('COALESCE(message.client_timestamp, EXTRACT(EPOCH FROM message.sent_at) * 1000) > :after', { after });
        }

        const messages = await qb.getMany();

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop();
        }

        const reactions = await this.getReactionsMap(messages.map(m => m.id));

        return {
            data: messages.map(m => ({ ...m, reactions: reactions[m.id] || {} })),
            meta: {
                hasMore,
                limit,
            },
        };
    }

    // Patient side: Send a message from patient
    async sendMessage(patientId: string, dto: CreateMessageDto) {
        const conversation = await this.conversationRepo.findOne({
            where: { patientId },
            relations: ['patient']
        });

        if (!conversation) throw new NotFoundException('Conversation not found');

        // Check for existing message to prevent duplicates (Offline-First Deduplication)
        const existingMessage = await this.messageRepo.findOne({ where: { id: dto.id } });
        if (existingMessage) {
            return existingMessage;
        }

        // 1. DB TRANSACTION TO ENSURE ATOMICITY
        const { savedMessage, savedNotifications } = await this.dataSource.transaction(async (manager) => {

            const message = manager.create(Message, {
                id: dto.id,
                clientTimestamp: dto.client_timestamp,
                conversationId: conversation.id,
                senderType: SenderType.PATIENT,
                senderId: patientId,
                body: dto.body,
                replyToMessageId: dto.replyToMessageId,
            });
            const savedMsg = await manager.save(message);

            // B. Update LastMessageAt
            await manager.update(Conversation, conversation.id, {
                lastMessageAt: savedMsg.sentAt,
            });

            // C. Get all Staff (from User table)
            const allStaff = await manager.find(User, { select: ['id'] });

            // D. Create array of Notifications for all Staff
            const notificationsToSave = allStaff.map(staff => {
                return manager.create(StaffNotification, {
                    userId: staff.id,
                    type: 'patient_message',
                    title: `New message from ${conversation.patient?.firstName || 'Patient'}`,
                    body: dto.body,
                    payload: {
                        conversationId: conversation.id,
                        messageId: savedMsg.id,
                        link: `/messages`
                    },
                });
            });

            const savedNotifs = await manager.save(notificationsToSave);

            return {
                savedMessage: savedMsg,
                savedNotifications: savedNotifs
            };
        });

        // 2. CALL FIREBASE TO SEND NOTIFICATIONS IN BATCH
        if (savedNotifications && savedNotifications.length > 0) {
            this.staffNotificationService.broadcastPush(savedNotifications)
                .catch((err: any) => this.logger.error(`FCM Broadcast Failed`, err.stack));
        }

        const fullyLoadedMessage = await this.messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['replyToMessage']
        });

        return fullyLoadedMessage || savedMessage;
    }

    // Patient side: Mark all staff messages as read in patient's conversation thread
    async markConversationAsReadByPatient(patientId: string) {
        const conversation = await this.getOrCreateConversation(patientId);
        await this.messageRepo.createQueryBuilder()
            .update(Message)
            .set({ readAt: new Date() })
            .where('conversation_id = :conversationId', { conversationId: conversation.id })
            .andWhere('sender_type = :senderType', { senderType: SenderType.STAFF })
            .andWhere('read_at IS NULL')
            .execute();

        return { success: true };
    }

    // Staff side: List all active conversations sorted by lastMessageAt or creation fallback
    async getConversationsForStaff(): Promise<any[]> {
        const conversations = await this.conversationRepo.createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.patient', 'patient')
            .leftJoinAndSelect('patient.assessments', 'assessment')
            .addSelect('COALESCE(conversation.last_message_at, conversation.created_at)', 'sort_date')
            .orderBy('sort_date', 'DESC')
            .getMany();

        const result: any[] = [];
        for (const conv of conversations) {
            const lastMessage = await this.messageRepo.findOne({
                where: { conversationId: conv.id },
                order: { sentAt: 'DESC' }
            });

            const unreadCount = await this.messageRepo.count({
                where: {
                    conversationId: conv.id,
                    senderType: SenderType.PATIENT,
                    readAt: IsNull()
                }
            });

            result.push({
                id: conv.id,
                patientId: conv.patientId,
                createdAt: conv.createdAt,
                lastMessageAt: conv.lastMessageAt,
                patient: conv.patient,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    body: lastMessage.body,
                    senderType: lastMessage.senderType,
                    sentAt: lastMessage.sentAt,
                    readAt: lastMessage.readAt
                } : null,
                unreadCount
            });
        }
        return result;
    }

    // Staff side: Get messages for a specific conversation
    async getMessagesForStaff(conversationId: string, query: GetMessagesQueryDto) {
        const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const { limit = 20, before, after } = query;

        const qb = this.messageRepo.createQueryBuilder('message')
            .leftJoinAndSelect('message.replyToMessage', 'replyToMessage')
            .where('message.conversation_id = :conversationId', { conversationId })
            .addSelect('COALESCE(message.client_timestamp, EXTRACT(EPOCH FROM message.sent_at) * 1000)', 'sort_time')
            .orderBy('sort_time', 'DESC')
            .addOrderBy('message.id', 'DESC')
            .take(limit + 1);

        if (before) {
            qb.andWhere('COALESCE(message.client_timestamp, EXTRACT(EPOCH FROM message.sent_at) * 1000) < :before', { before });
        }

        if (after) {
            qb.andWhere('COALESCE(message.client_timestamp, EXTRACT(EPOCH FROM message.sent_at) * 1000) > :after', { after });
        }

        const messages = await qb.getMany();

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop();
        }

        const reactions = await this.getReactionsMap(messages.map(m => m.id));

        return {
            data: messages.map(m => ({ ...m, reactions: reactions[m.id] || {} })),
            meta: {
                hasMore,
                limit,
            },
        };
    }

    // Staff side: Send a message from staff
    async sendStaffMessage(conversationId: string, staffId: string, dto: CreateMessageDto) {
        const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check for existing message to prevent duplicates (Offline-First Deduplication)
        const existingMessage = await this.messageRepo.findOne({ where: { id: dto.id } });
        if (existingMessage) {
            return existingMessage;
        }

        // 1. DB TRANSACTION
        const { savedMessage, savedNotification } = await this.dataSource.transaction(async (manager) => {

            const message = manager.create(Message, {
                id: dto.id,
                clientTimestamp: dto.client_timestamp,
                conversationId: conversation.id,
                senderType: SenderType.STAFF,
                senderId: staffId,
                body: dto.body,
                replyToMessageId: dto.replyToMessageId,
            });
            const savedMsg = await manager.save(message);

            // B. Update LastMessageAt of Conversation
            await manager.update(Conversation, conversation.id, {
                lastMessageAt: savedMsg.sentAt,
            });

            // C. Create and save Notification for Patient
            const notification = manager.create(PatientNotification, {
                patientId: conversation.patientId,
                type: NotificationType.CLINIC_MESSAGE,
                title: 'New Message from Adelaide Knee Clinic',
                body: dto.body,
                payload: {
                    conversationId: conversation.id,
                    messageId: savedMsg.id,
                    link: '/chat'
                },
            });
            const savedNotif = await manager.save(notification);

            return {
                savedMessage: savedMsg,
                savedNotification: savedNotif
            };
        });

        // 2. AFTER TRANSACTION -> SEND FIREBASE
        if (savedNotification) {
            this.notificationsService.sendPush(conversation.patientId, savedNotification)
                .catch((err: any) => this.logger.error(`FCM Push Failed for notification ${savedNotification.id}`, err.stack));
        }

        const fullyLoadedMessage = await this.messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['replyToMessage']
        });

        return fullyLoadedMessage || savedMessage;
    }

    // Staff side: Mark all patient messages as read in conversation thread
    async markConversationAsReadByStaff(conversationId: string) {
        const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        await this.messageRepo.createQueryBuilder()
            .update(Message)
            .set({ readAt: new Date() })
            .where('conversation_id = :conversationId', { conversationId })
            .andWhere('sender_type = :senderType', { senderType: SenderType.PATIENT })
            .andWhere('read_at IS NULL')
            .execute();

        return { success: true };
    }

    // Build a map: messageId -> { [emoji]: { count, reactorIds } }
    async getReactionsMap(messageIds: string[]): Promise<Record<string, Record<string, { count: number; reactorIds: string[] }>>> {
        if (messageIds.length === 0) return {};

        const reactions = await this.reactionRepo.find({
            where: { messageId: In(messageIds) },
        });

        const map: Record<string, Record<string, { count: number; reactorIds: string[] }>> = {};

        for (const r of reactions) {
            if (!map[r.messageId]) map[r.messageId] = {};
            if (!map[r.messageId][r.emoji]) map[r.messageId][r.emoji] = { count: 0, reactorIds: [] };
            map[r.messageId][r.emoji].count++;
            map[r.messageId][r.emoji].reactorIds.push(r.senderId);
        }

        return map;
    }

    // Toggle a reaction (Facebook model: one emoji per user per message)
    async toggleReaction(
        messageId: string,
        conversationId: string,
        senderId: string,
        senderType: ReactionSenderType,
        emoji: string,
    ): Promise<{ messageId: string; conversationId: string; reactions: Record<string, { count: number; reactorIds: string[] }> }> {
        // Fallback: If conversationId is somehow missing from the client payload, fetch it from the message
        let actualConvId = conversationId;
        if (!actualConvId) {
            const msg = await this.messageRepo.findOne({ where: { id: messageId } });
            if (!msg) throw new Error(`Message ${messageId} not found`);
            actualConvId = msg.conversationId;
        }

        const existing = await this.reactionRepo.findOne({
            where: { messageId, senderId, senderType },
        });

        console.log(`[toggleReaction DEBUG] messageId=${messageId}, originalConvId=${conversationId}, actualConvId=${actualConvId}, senderId=${senderId}, senderType=${senderType}, emoji=${emoji}`);
        console.log(`[toggleReaction DEBUG] existing=${JSON.stringify(existing)}`);

        if (existing) {
            if (existing.emoji === emoji) {
                // Same emoji → toggle off
                await this.reactionRepo.delete(existing.id);
            } else {
                // Different emoji → replace
                existing.emoji = emoji;
                await this.reactionRepo.save(existing);
            }
        } else {
            // No existing reaction → create
            const reaction = this.reactionRepo.create({
                messageId,
                conversationId: actualConvId,
                senderId,
                senderType,
                emoji,
            });
            await this.reactionRepo.save(reaction);
        }

        // Return updated reactions for this message
        const map = await this.getReactionsMap([messageId]);
        return { messageId, conversationId: actualConvId, reactions: map[messageId] || {} };
    }
}