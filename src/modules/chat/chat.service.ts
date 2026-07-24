import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Conversation } from './entities/conversations.entity';
import { Message, SenderType } from './entities/messages.entity';
import { CreateMessageDto, GetMessagesQueryDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepo: Repository<Message>,
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
            .where('message.conversation_id = :conversationId', { conversationId: conversation.id })
            .orderBy('message.sentAt', 'DESC')
            .take(limit + 1);

        if (before) {
            qb.andWhere('message.sentAt < :before', { before: new Date(before) });
        }

        if (after) {
            qb.andWhere('message.sentAt > :after', { after: new Date(after) });
        }

        const messages = await qb.getMany();

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop();
        }

        return {
            data: messages,
            meta: {
                hasMore,
                limit,
            },
        };
    }

    // Patient side: Send a message from patient
    async sendMessage(patientId: string, dto: CreateMessageDto) {
        const conversation = await this.getOrCreateConversation(patientId);

        const message = this.messageRepo.create({
            conversationId: conversation.id,
            senderType: SenderType.PATIENT,
            senderId: patientId,
            body: dto.body,
        });
        await this.messageRepo.save(message);

        await this.conversationRepo.update(conversation.id, {
            lastMessageAt: message.sentAt,
        });

        return message;
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
            .where('message.conversation_id = :conversationId', { conversationId: conversation.id })
            .orderBy('message.sentAt', 'DESC')
            .take(limit + 1);

        if (before) {
            qb.andWhere('message.sentAt < :before', { before: new Date(before) });
        }

        if (after) {
            qb.andWhere('message.sentAt > :after', { after: new Date(after) });
        }

        const messages = await qb.getMany();

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop();
        }

        return {
            data: messages,
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

        const message = this.messageRepo.create({
            conversationId: conversation.id,
            senderType: SenderType.STAFF,
            senderId: staffId,
            body: dto.body,
        });
        await this.messageRepo.save(message);

        await this.conversationRepo.update(conversation.id, {
            lastMessageAt: message.sentAt,
        });

        return message;
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
}