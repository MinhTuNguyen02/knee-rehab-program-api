import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Message } from './messages.entity';
import { Patient } from '../../assessments/entities/patient.entity';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id', type: 'uuid' })
    patientId: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Index()
    @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
    lastMessageAt: Date;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @ManyToOne(() => Patient, { eager: false })
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;
}