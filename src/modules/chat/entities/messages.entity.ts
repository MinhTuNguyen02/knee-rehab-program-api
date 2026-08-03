import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversations.entity';

export enum SenderType {
    PATIENT = 'patient',
    STAFF = 'staff',
}

@Entity('messages')
export class Message {
    @PrimaryColumn('uuid')
    id: string;

    @Column({
        name: 'client_timestamp', type: 'bigint', nullable: true, transformer: {
            to: (value: number) => value,
            from: (value: string) => parseInt(value, 10)
        }
    })
    clientTimestamp: number;

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

    @CreateDateColumn({ name: 'sent_at', type: 'timestamptz' })
    sentAt: Date;

    @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
    readAt: Date;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;
}