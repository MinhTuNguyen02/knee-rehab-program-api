import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Message } from './messages.entity';
import { Patient } from '../../assessments/entities/patient.entity';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id', type: 'uuid' })
    patientId: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Index()
    @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
    lastMessageAt: Date;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @ManyToOne(() => Patient, { eager: false })
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;

    @Column({ name: 'streak_count', type: 'int', default: 0 })
    streakCount: number;

    @Column({ name: 'streak_active_today', type: 'boolean', default: false })
    streakActiveToday: boolean;

    @Column({ name: 'patient_messaged_today', type: 'boolean', default: false })
    patientMessagedToday: boolean;

    @Column({ name: 'staff_messaged_today', type: 'boolean', default: false })
    staffMessagedToday: boolean;
}