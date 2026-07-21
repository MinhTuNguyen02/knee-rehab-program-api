import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../assessments/entities/patient.entity';

export enum NotificationType {
    WELCOME = 'welcome',
    ASSESSMENT_REMINDER = 'assessment_reminder',
    CLINIC_MESSAGE = 'clinic_message',
}

@Entity('patient_notifications')
export class PatientNotification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    patientId: string;

    @Column({ type: 'varchar' })
    type: NotificationType;

    @Column()
    title: string;

    @Column('text')
    body: string;

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, any> | null;

    @Column({ type: 'timestamptz', nullable: true })
    readAt: Date | null;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @CreateDateColumn()
    createdAt: Date;
}