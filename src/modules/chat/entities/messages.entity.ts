import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversations.entity';

export enum SenderType {
    PATIENT = 'patient',
    STAFF = 'staff',
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'conversation_id', type: 'uuid' })
    conversationId: string;

    @Column({
        name: 'sender_type',
        type: 'enum',
        enum: SenderType,
    })
    senderType: SenderType;

    @Column({ name: 'sender_id', type: 'uuid' })
    senderId: string;

    @Column({ type: 'text' })
    body: string;

    @CreateDateColumn({ name: 'sent_at', type: 'timestamp' })
    sentAt: Date;

    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    readAt: Date;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;
}