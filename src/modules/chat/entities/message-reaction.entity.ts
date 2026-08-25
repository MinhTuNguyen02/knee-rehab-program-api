import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Message } from './messages.entity';

export enum ReactionSenderType {
    PATIENT = 'patient',
    STAFF = 'staff',
}

@Entity('chat_message_reactions')
@Unique(['messageId', 'senderId', 'senderType'])
export class MessageReaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'message_id', type: 'uuid' })
    messageId: string;

    @Column({ name: 'conversation_id', type: 'uuid' })
    conversationId: string;

    @Column({
        name: 'sender_type',
        type: 'enum',
        enum: ReactionSenderType,
    })
    senderType: ReactionSenderType;

    @Column({ name: 'sender_id', type: 'uuid' })
    senderId: string;

    @Column({ type: 'varchar', length: 10 })
    emoji: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => Message, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'message_id' })
    message: Message;
}
